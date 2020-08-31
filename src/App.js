import React from 'react';
import { Page, Image, Text, View,PDFViewer , Document, StyleSheet, Font  } from '@react-pdf/renderer';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import Slider from "react-slick";
import "./App.css";
import badge from './badge.png';
import mondaySdk from "monday-sdk-js";
import _ from "lodash";

import { request, GraphQLClient } from 'graphql-request'
const monday = mondaySdk();
var link = '';

//Create connection called 'client' that connects to Monday.com's API
const client = new GraphQLClient('https://api.monday.com/v2/', {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjc0Mzc5MjQwLCJ1aWQiOjE1NzYwOTM5LCJpYWQiOiIyMDIwLTA4LTMxVDE1OjE1OjE1LjAwMFoiLCJwZXIiOiJtZTp3cml0ZSJ9.U2iyA6sTqyXoANa68g9_h-i3Kik7Nkjpnky6LNg3iRQ'
    },
    
});

// Create styles
const styles = StyleSheet.create({
  body: {
    paddingTop: 50,
    paddingBottom: 65,
    paddingHorizontal: 35,
    border:'1pt solid #000',
  },
  title: {
    fontSize: 35,
    textAlign: 'center',
    fontFamily: 'Times-Roman',
    marginBottom: 40,
    marginTop: 40,
  },
  author: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 40,
  },
  subtitle: {
    fontSize: 18,
    margin: 12,
    textAlign: 'center',
    fontFamily: 'Courier',
    fontStyle : 'Oblique',
  },
  subtitle2: {
    fontSize: 20,
    margin: 12,
    textAlign: 'center',
    fontFamily: 'Times-Roman',
  },
  text: {
    margin: 12,
    fontSize: 14,
    textAlign: 'justify',
    fontFamily: 'Times-Roman'
  },
  image: {
    marginVertical: 15,
    marginHorizontal: 100,
    height:'60%'
  },
  image2: {
    marginVertical: 15,
    marginHorizontal: 100,
    height: '60%'
  },
  header: {
    fontSize: 12,
    marginBottom: 20,
    textAlign: 'center',
    color: 'grey',
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 12,
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'grey',
  },
  page:{
    border:'1pt solid #000',
  }
});
// Create Document Component
const MyDocument = () => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text>{this.orgName()}</Text>
      </View>
      <View style={styles.section}>
        <Text>Section #2</Text>
      </View>
    </Page>
  </Document>
);

class App extends React.Component {
  constructor(props) {
    super(props);

    // Default state
    this.state = {
      settings: {},
      name: "",      
      context: {},
      boards: [],
      names: [],
      signerFilename: "https://sevabhava.in/assets/img/logo.png",
      itemIds: false
    };
  }

  componentDidMount() {
    // TODO: set up event listeners
    console.log("reached here")
    monday.listen("settings", this.getSettings);    
    monday.listen("context", this.getContext);
    monday.listen("itemIds", this.getItemIds);
  }
  getSettings = (res) => {
    this.setState({ settings: res.data });
    console.log("settings!", res.data);
    this.generateNames()
  };

  getItemIds = (res) => {
    const itemIds = {};
    res.data.forEach((id) => (itemIds[id] = true));
    this.setState({ itemIds: itemIds });
    console.log("itemIds")
    this.generateNames()
  };

  getContext = (res) => {
    const context = res.data;
    console.log("context!", context);
    this.setState({ context });

    const boardIds = context.boardIds || [context.boardId];
    monday
      .api(`query { boards(ids:[${boardIds}]) { id, items { id, name, column_values { id, text } } }}`)
      .then((res) => {
        this.setState({ boards: res.data.boards }, () => {
          console.log(res.data.boards[0].items.slice(0, 10).map((item) => item.id));
          this.generateNames();
        });
      });
  };

  generateNames = () => {
    const names = this.getName();
    console.log("docs", names);
    this.setState({ names });
  };

  getName = () => {
    const { boards, settings, itemIds} = this.state;
    console.log(boards);
    var signerFilename = "https://sevabhava.in/assets/img/logo.png";
    const result = boards.map((board) => {
      console.log(board);
      return board.items
        .filter((item) => !itemIds || itemIds[item.id])
        .map((item) => {
          let columnIds, values;
          console.log(settings.column);
          if (settings.column) columnIds = Object.keys(settings.column);
          //console.log(columnIds.length);
          if (columnIds && columnIds.length > 0) {
            const columnValues = item.column_values.filter((cv) => {
              return columnIds.includes(cv.id);
            });
            values = columnValues
              .map((cv) => cv.text)
              .filter((t) => t && t.length > 0)
              .join(" ");
            console.log(columnIds);
            console.log(columnValues);
            if (columnIds.includes("name")) values += item.name;
            return values;
          } else {
            console.log("in here not helping");
            return item.name;
          }
        });
    });
    console.log(result.length)
    if (settings.signatureUploader) {
      console.log("monday knows file is uploaded  "+settings.signatureUploader.id);
      client.request(`query { assets (ids:[${settings.signatureUploader.id}]) { id, url_thumbnail}}`)
      .then( async (data) =>{ 

        signerFilename =  await data.assets[0].url_thumbnail;
        let documents = result[0].map((val) => {  
          console.log(val)
          return (
            <PDFViewer>
              <Document>
                <Page size="A4" style={styles.body}>
                <Image
                  style={styles.image}
                  src="https://sevabhava.in/assets/img/logo.png"
                />
                <Text style={styles.title}>Certificate for Volunteering</Text>
                <Text style={styles.subtitle}>This Certificate is presented to:</Text>
                <Text style={styles.subtitle2}>{val}</Text>
                <Text style={styles.subtitle}>For taking part in volunteering activities organised by: </Text>
                <Text style={styles.subtitle2}>{this.orgName()}</Text>
                <Image width='30px'
                  style={styles.image2}
                  src= {signerFilename}
                />
                <Text style={styles.subtitle}>Signed by: </Text>
                <Text style={styles.subtitle2}>{this.signerName()}</Text>
                </Page>
              </Document>
            </PDFViewer>
          )});
        console.log(documents)
        this.setState({ names: documents});
        return _.flatten(documents);
        
      });
    } else {
      signerFilename= "https://img.pngio.com/digital-signature-signature-block-signatures-png-download-1296-signature-png-900_700.jpg"
      let documents = result[0].map((val) => {  
        console.log(val)
        return (
          <PDFViewer>
            <Document>
              <Page size="A4" style={styles.body}>
              <Image
                style={styles.image}
                src={require('./badge.png')}
              />
              <Text style={styles.title}>Certificate for Volunteering</Text>
              <Text style={styles.subtitle}>This Certificate is presented to:</Text>
              <Text style={styles.subtitle2}>{val}</Text>
              <Text style={styles.subtitle}>For taking part in volunteering activities organised by: </Text>
              <Text style={styles.subtitle2}>{this.orgName()}</Text>
              <Image width='30px'
                style={styles.image}
                src= {signerFilename}
              />
              <Text style={styles.subtitle}>Signed by: </Text>
              <Text style={styles.subtitle2}>{this.signerName()}</Text>
              </Page>
            </Document>
          </PDFViewer>
        )});
      console.log(documents)
      return _.flatten(documents);
    }
    
  };

  orgName = () => {
    const { settings } = this.state;
    console.log(settings)
    return settings.orgName ? settings.orgName : "Organization Name";

  };

  signerName = () => {
    const { settings } = this.state;
    console.log(settings.signatureUploader)
    return settings.signerName ? settings.signerName : "Signer Name";

  };
  fileName = () => {
    const { settings, signerFilename } = this.state;
    console.log(settings.signatureUploader)
    if (settings.signatureUploader) {
      console.log("monday knows file is uploaded  "+settings.signatureUploader.id)
      client.request(`query { assets (ids:[${settings.signatureUploader.id}]) { id, url}}`)
      .then( async (data) =>{ 
        
        const signerFilename = await data.assets[0].url
        this.setState({ signerFilename });
        
      });
    } else {
      const signerFilename = "https://img.pngio.com/digital-signature-signature-block-signatures-png-download-1296-signature-png-900_700.jpg"
      this.setState({ signerFilename });
    }
  };

  render() {
    const { settings, context, names, signerFilename } = this.state;
    var settings2 = {
      dots: true,
      infinite: true,
      speed: 500,
      slidesToShow: 1,
      slidesToScroll: 1
    };

    return (
      <div>
      <Slider {...settings2}  width='60vw'>

        {names}
       
      </Slider>
      </div>
    );
  }
}

export default App;
