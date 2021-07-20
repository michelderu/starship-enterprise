import React from 'react';
import logo from './uss-enterprise.jpg';

class Header extends React.Component {

  render() {
    return (
      <div class="container col-xxl-8 px-4 py-5">
        <div class="row flex-lg-row-reverse align-items-center g-5 py-5">
          <div class="col-10 col-sm-8 col-lg-6">
            <img src={logo} class="d-block mx-lg-auto img-fluid" alt="U.S.S. Enterprise" width="700" height="500" loading="lazy"/>
          </div>
          <div class="col-lg-6">
            <h1 class="display-5 fw-bold lh-1 mb-3">U.S.S. Enterprise Dashboard</h1>
            <p class="lead">Health monitoring system for Starships.</p>
            <div class="d-grid gap-2 d-md-flex justify-content-md-start">
              <a href="https://github.com/michelderu/starship-enterprise" class="btn btn-primary">
                  Check out the repository
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Header;

