import * as React from 'react';
import Slider from 'react-slick';//TODO remove

import path = require('path');
import {
  BsDmId,
  DmDataFeed,
  dmGetSimpleStringFromParameterizedString,
} from "@brightsign/bsdatamodel";

export interface SlickProps {
  height: number;
  width: number;
  // filePaths: string [];
  dataFeedId: BsDmId;
}

export default class Slick extends React.Component<SlickProps, object> {

  constructor(props: SlickProps) {
    super(props);
  }

  getSources() {
    return this.props.filePaths.map( (filePath : string, index : number) => {
      return (
        <div key={index}><img src={filePath} key={index}/></div>
        );
    });
  }

  render() {
    var settings = {
      dots: true,
      // infinite: true,
      // speed: 500,
      slidesToShow: 2,
      // slidesToScroll: 1
    };
    return (
      <div className='slickContainer'>
        <Slider {...settings}>
          {this.getSources()}
        </Slider>
      </div>
    );

    /*
     <div><img src='http://placekitten.com/g/400/200' /></div>
     <div><img src='http://placekitten.com/g/400/200' /></div>
     <div><img src='http://placekitten.com/g/400/200' /></div>
     <div><img src='http://placekitten.com/g/400/200' /></div>

     */
  }
}
