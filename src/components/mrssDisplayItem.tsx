import * as React from "react";

const path = require("path");

import ImageContainer from '../containers/imageContainer';

export interface MRSSProps {
  dataFeedId: string;
  mrssDataFeedItem : any;
  mrssDataFeedItemPath : string;
  width: number;
  height: number;
  duration: number;
  onTimeout: Function;
}


export default class MrssDisplayItem extends React.Component<MRSSProps, object> {

  timeout : any;

  constructor(props : MRSSProps) {
    super(props);
    this.timeout = null;
  }

  render () {

    const src : string = path.join('file://', this.props.mrssDataFeedItemPath);
    console.log('mrssDisplayItem.js::render, image src: ' + src);

    if (this.props.mrssDataFeedItem.isImage()) {
      return (
        <ImageContainer
          resourceIdentifier={src}
          width={this.props.width}
          height={this.props.height}
          duration={this.props.duration}
          onTimeout={this.props.onTimeout.bind(this)}
        />
      );
    }
    else {
      debugger;
    }
  }
}
