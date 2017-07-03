import * as React from 'react';

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

  render() {

    const self: Image = this;

    if (this.timeout) {
      debugger;
    }

    this.timeout = setTimeout( () => {
        this.timeout = null;
        self.props.onTimeout();
      }
      , this.props.duration);

    return (
      <img
        src={this.props.src}
        width={this.props.width.toString()}
        height={this.props.height.toString()}
      />
    );
  }
}
