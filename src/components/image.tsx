import * as React from 'react';
import Slider from 'react-slick';//TODO remove

import path = require('path');

export interface ImageProps {
  height: number;
  width: number;
  duration: number;
  onTimeout: () => void;
  src: string;
}

export default class Image extends React.Component<ImageProps, object> {

  private timeout: any;

  constructor(props: ImageProps) {
    super(props);
    this.timeout = null;
  }

  shouldComponentUpdate() {

    if (this.timeout) {
      return false;
    }

    return true;
  }

  // render() {
  //
  //   const self: Image = this;
  //
  //   if (this.timeout) {
  //     debugger;
  //   }
  //
  //   this.timeout = setTimeout( () => {
  //       this.timeout = null;
  //       self.props.onTimeout();
  //     }
  //     , this.props.duration);
  //
  //   return (
  //     <img
  //       src={this.props.src}
  //       width={this.props.width.toString()}
  //       height={this.props.height.toString()}
  //     />
  //   );
  // }

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
