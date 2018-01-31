import React, {
  PropTypes
} from 'react'
import {
  connect
} from 'react-redux'
/* eslint-disable require-jsdoc*/
class AboutData extends React.Component {
/* eslint-disable require-jsdoc*/
  constructor(props) {
    super(props)
  }

  render() {
    return (
      <div className='about-data'>
        Selected date: {this.props.date}
        <br />
        journeys: {this.props.journeys}
        <br />
        people: {this.props.people}
      </div>
    );
  }
}
/* eslint-disable require-jsdoc*/
function mapStateToProps(state) {
  console.log(state, 'HHHH')
  return {
    date: state.date.day,
    journeys: state.date.journeys,
    people: state.date.people
  }
}

export default connect(mapStateToProps)(AboutData);
