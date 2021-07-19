import React, { Component } from 'react';
import './App.css';

class App extends Component{
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

  componentDidMount() {
    this.callApi();
  }

  render() {
      return (
        <div class="container-fluid">
        <div class="row">
          <div class="col-md-12">
            <table class="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Date</th>
                  <th>Priority</th>
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
      </div>
      );
  }
}

export default App;