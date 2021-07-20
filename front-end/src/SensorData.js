import React, { Component } from 'react';

class SensorData extends Component{
  constructor(props) {
    super(props);
    this.state = { 
      apiResponse: [
      ]
    };
  }

  callApi() {
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/javascript");

    var raw = {
      ship: "Starship Astra", 
      sensor: "oxygen"
    };

    var requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(raw)
    };
    
    fetch("https://f8nfklyolb.execute-api.eu-central-1.amazonaws.com/dev/getReadings", requestOptions)
    .then(res => res.text())
    .then(res => this.setState({ apiResponse: JSON.parse(res) }))
    .catch(err => err);
  }

  // Set up a timer for this component to refresh every 30 seconds
  componentDidMount() {
    this.timerID = setInterval(
      () => this.tick(),
      30000
    );
  }

  // Clear the timer
  componentWillUnmount() {
    clearInterval(this.timerID);
  }

  // Update the values of this component
  tick() {
    this.callApi();
  }

  render() {
      return (

      <div class="container px-4 py-5">

        <div class="row"><h3>Oxygen sensor data</h3></div>
        <div class="row">
          <div class="col-md-12">
            <table class="table">
              <thead>
                <tr>
                  <th>Space ship</th>
                  <th>Timestamp</th>
                  <th>Oxygen (ppm)</th>
                </tr>
              </thead>
              <tbody>
                {this.state.apiResponse.map(item => (
                  <tr class={item.reading < 18 ? "table-danger" : "table-active"}>
                    <td>{item.ship}</td>
                    <td>{item.yyyymmddhhmm}</td>
                    <td>{item.reading}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div class="row">(Rolling window of last 5 minutes, updates every second. Red lines mark alerts!)</div>
      </div>
      );
  }
}

export default SensorData;