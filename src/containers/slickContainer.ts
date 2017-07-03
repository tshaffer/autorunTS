import { connect } from 'react-redux';

import {
  ArState,
} from '../types';

import Slick from '../components/slick';
import { SlickProps } from '../components/slick';

function mapStateToProps(state : ArState, ownProps : SlickProps) : SlickProps {
  return {
    ...ownProps,
  };
}

const ImageContainer = connect(
  mapStateToProps,
)(Slick);

export default ImageContainer;
