describe('Geocoder', function() {

  describe('NOKIA', function() {

    it("don't remove the spaces in the user-submitted addresses [NOKIA]", function(done) {
      var regexp = new RegExp(/http:\/\/places.nlp.nokia.com\/places\/v1\/discover\/search\/\?q\=bn20%208qt/);

      cdb.geo.geocoder.NOKIA.geocode('bn20 8qt', function(d) {
        expect(this.url).toMatch(regexp);
        done();
      });
    });

    it("we should get a direction that exists using NOKIA", function(done) {
      var data;
      cdb.geo.geocoder.NOKIA.geocode('Madrid, Spain', function(d) {
        data = d;
        expect(data.length).not.toEqual(0);
        expect(data[0].lat).not.toEqual(undefined);
        expect(data[0].lon).not.toEqual(undefined);
        expect(data[0].boundingbox).toBeTruthy();
        done();
      });
    });

    it("we should get a direction with # character using NOKIA", function(done) {
      var data;
      cdb.geo.geocoder.NOKIA.geocode('# Mexico', function(d) {
        data = d;
        expect(data.length).not.toEqual(0);
        expect(data[0].lat).not.toEqual(undefined);
        expect(data[0].lon).not.toEqual(undefined);
        done();
      });
    });

    it("we shouldn't get a direction that doesn't exist using NOKIA", function(done) {
      var data;
      cdb.geo.geocoder.NOKIA.geocode('68461092610314965639', function(d) {
        data = d;
        expect(data.length).toEqual(0);
        done();
      });
    });
  });

describe('MAPZEN', function() {

    it("don't remove the spaces in the user-submitted addresses [MAPZEN]", function(done) {
      var regexp = new RegExp(/http:\/\/search.mapzen.com\/v1\/search\?text\=bn20%208qt/);
      cdb.geo.geocoder.MAPZEN.geocode('bn20 8qt', function(d) {
        expect(this.url).toMatch(regexp);
        done();
      });
    });

    it("we should get a direction that exists using MAPZEN", function(done) {
      var data;
      cdb.geo.geocoder.MAPZEN.geocode('Madrid, Spain', function(d) {
        data = d;
        expect(data.length).not.toEqual(0);
        expect(data[0].lat).not.toEqual(undefined);
        expect(data[0].lon).not.toEqual(undefined);
        //expect(data[0].boundingbox).toBeTruthy();
        done();
      });
    });

    it("we should get a direction with # character using MAPZEN", function(done) {
      var data;
      cdb.geo.geocoder.MAPZEN.geocode('# Mexico', function(d) {
        data = d;
        expect(data.length).not.toEqual(0);
        expect(data[0].lat).not.toEqual(undefined);
        expect(data[0].lon).not.toEqual(undefined);
        done();
      });
    });

    it("we shouldn't get a direction that doesn't exist using MAPZEN", function(done) {
      var data;
      cdb.geo.geocoder.MAPZEN.geocode('****', function(d) {
        data = d;
        expect(data.length).toEqual(0);
        done();
      });
    });
  });

  describe('YAHOO', function() {

    it("we shouldn't get a direction that doesn't exist using YAHOO", function(done) {
      var data;
      cdb.geo.geocoder.YAHOO.geocode('Wadusworld', function(d) {
        data = d;
        expect(data.length).toEqual(0);
        done();
      });
    });

  });

});
