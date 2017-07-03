import { connect } from 'react-redux';

import {
  BsDmId,
  DmSignState,
  DmState,
  DmZone,
  dmOpenSign,
  dmGetZonesForSign,
  dmGetZoneById,
  dmGetDataFeedIdsForSign,
  dmGetDataFeedById,
  dmGetSignState,
  dmGetSimpleStringFromParameterizedString, DmcDataFeed, DmParameterizedString,
} from '@brightsign/bsdatamodel';

import {
  ArState,
} from '../types';

import * as Utilities from '../utilities/utilities';

import Slick from '../components/slick';
import { SlickProps } from '../components/slick';

function mapStateToProps(state : ArState, ownProps : SlickProps) : SlickProps {
  return {
    ...ownProps,
    filePaths : getFilePaths(state.bsdm, ownProps)
  };
}

function getFilePaths(bsdm : DmState, ownProps : SlickProps) : Array<string> {
  const dataFeed : DmcDataFeed = dmGetDataFeedById(bsdm, { id : ownProps.dataFeedId });
  const url : DmParameterizedString = dataFeed.url as DmParameterizedString;
  const slickSpec : string = dmGetSimpleStringFromParameterizedString(url);
  const slickItem : any = JSON.parse(slickSpec);
  console.log(slickItem);

  let filePaths : Array<string> = [];
  slickItem.files.imageItem.forEach( (imageItem : any) => {
    const fileName = imageItem.file['@name'];
    const filePath = Utilities.getPoolFilePath(fileName);
    filePaths.push(filePath);
  });
  return filePaths;
}
const ImageContainer = connect(
  mapStateToProps,
)(Slick);

export default ImageContainer;
