import React from 'react';

class Footer extends React.Component {

  render() {
    return (
      <div class="container px-4 py-5" id="hanging-icons">
        <div class="row g-4 py-5 row-cols-1 row-cols-lg-3">
          <div class="col d-flex align-items-start">
            <div>
              <div class="icon-square text-dark flex-shrink-0 me-3">
                <img src="https://avatars.githubusercontent.com/u/56047707?s=200&v=4" alt="" height="40"/>
              </div>
              <div>&nbsp;</div>
              <p>DataStax is the company that provides data driven organizations Enterprise Services around Apache Cassandra. Cassandra is used by digital front-runners like: Spotify, ING and Booking.com.</p>
              <a href="https://www.datastax.com" class="btn btn-primary">
                I want to know more
              </a>
            </div>
          </div>
          <div class="col d-flex align-items-start">
            <div>
              <div class="icon-square text-dark flex-shrink-0 me-3">
                <img src="https://thestack.technology/wp-content/uploads/2021/02/ds-astra-logotype.png" alt="" height="40"/>
              </div>
              <div>&nbsp;</div>
              <p>DataStax Astra is Cassandra in the cloud. Managed. Serverless. Cloud agnostic. Astra comes with a modern API gateway that exposes REST, GraphQL and Document services. It saves you up to 76%.</p>
              <a href="https://www.datastax.com/products/datastax-astra" class="btn btn-primary">
                I want to know more
              </a>
            </div>
          </div>
          <div class="col d-flex align-items-start">
          <div>
              <div class="icon-square text-dark flex-shrink-0 me-3">
                <img src="https://stargate.io/assets/images/init-stargate/stargate.png" alt="" height="40"/>
              </div>
              <div>&nbsp;</div>
              <p>Stargate provides the API gateway that exposes Cassandra through REST, GraphQL and Document APIs. It allows for super quick app development using modern technologies like React and Node.js.</p>
              <a href="https://stargate.io" class="btn btn-primary">
              I want to know more
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Footer;
