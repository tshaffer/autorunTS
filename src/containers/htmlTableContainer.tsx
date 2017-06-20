import { connect } from 'react-redux';

import {
  ArState,
} from '../types';

import HtmlTable from '../components/htmlTable';
// import { ImageProps } from '../components/image';

function mapStateToProps(state : ArState, ownProps : any) : any {
  return {
    ...ownProps,
  };
}

const HtmlTableContainer = connect(
  mapStateToProps,
)(HtmlTable);

export default HtmlTableContainer;
