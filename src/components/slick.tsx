import * as React from 'react';
import Slider from 'react-slick';//TODO remove

import path = require('path');

export interface SlickProps {
  height: number;
  width: number;
  src: string;
}

export default class Slick extends React.Component<SlickProps, object> {

  constructor(props: SlickProps) {
    super(props);
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
          <div><img src='http://placekitten.com/g/400/200' /></div>
          <div><img src='http://placekitten.com/g/400/200' /></div>
          <div><img src='http://placekitten.com/g/400/200' /></div>
          <div><img src='http://placekitten.com/g/400/200' /></div>
        </Slider>
      </div>
    );
  }
}
