import * as React from 'react';

export interface ImageProps {
  height: number;
  width: number;
  src: string;
}

export default class Image extends React.Component<ImageProps, object> {

  render() {
    return (
      <img
        src={this.props.src}
        width={this.props.width.toString()}
        height={this.props.height.toString()}
        onKeyPress = {() => {
          console.log('**** - onKeyPress invoked');
        }}
        onMouseDown = {() => {
          console.log('**** - onMouseDown invoked');
        }}
      />
    );
  }
}
