import * as React from 'react';
import Slider from 'react-slick';//TODO remove
import "slick-carousel/slick/slick.scss";
import "slick-carousel/slick/slick-theme.scss";

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
      infinite: true,
      speed: 500,
      slidesToShow: 1,
      slidesToScroll: 1
    };
    return (
      <Slider {...settings}>
        <div><h3>1</h3></div>
        <div><h3>2</h3></div>
        <div><h3>3</h3></div>
        <div><h3>4</h3></div>
        <div><h3>5</h3></div>
        <div><h3>6</h3></div>
      </Slider>
    );
  }
}
