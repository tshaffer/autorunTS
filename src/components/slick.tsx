import * as React from 'react';
import Slider from 'react-slick';

import path = require('path');
import {
  BsDmId,
  DmDataFeed,
  dmGetSimpleStringFromParameterizedString,
} from "@brightsign/bsdatamodel";

export interface SlickProps {
  height: number;
  width: number;
  filePaths: string [];
  dataFeedId: BsDmId;
}

export default class Slick extends React.Component<SlickProps, object> {

  constructor(props: SlickProps) {
    super(props);
  }

  getSources() {
    return this.props.filePaths.map( (filePath : string, index : number) => {
      return (
        <div key={index} className='slickItem'>
          <img
            src={filePath}
            width={this.props.width * 0.75}
            height={this.props.height * 0.75}
          />
        </div>
        );
    });
  }

  render() {
    var settings = {
      dots: true,
      infinite: true,
      // speed: 500,
      slidesToShow: 2,
      // slidesToScroll: 1,
      autoplay : false,
      autoplaySpeed : 2000,
      fade : true,
    };
    return (
      <div className='slickContainer'>
        <Slider {...settings}>
          {this.getSources()}
        </Slider>
      </div>
    );
  }
}
