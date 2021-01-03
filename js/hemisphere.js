/**
 * Hemisphere composite shape
 */

( function( root, factory ) {
  // module definition
  if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory( require('./boilerplate'), require('./vector'),
        require('./anchor'), require('./ellipse') );
  } else {
    // browser global
    var Zdog = root.Zdog;
    Zdog.Hemisphere = factory( Zdog, Zdog.Vector, Zdog.Anchor, Zdog.Ellipse );
  }
}( this, function factory( utils, Vector, Anchor, Ellipse ) {

var Hemisphere = Ellipse.subclass({
  fill: true,
  frontDiameter : 0,
  frontFace: undefined,
});

var TAU = utils.TAU;

Hemisphere.prototype.create = function( /* options */) {
  // call super
  Ellipse.prototype.create.apply( this, arguments );
  if (this.frontDiameter >= this.diameter) {
    throw "frontDiameter should be < diameter"
  } else {
    this.frontDiameter = Math.max(this.frontDiameter, 0);
  }

  let x = 1; // ratio: height / radius
  if (this.frontDiameter > 0) {
    let angle = Math.acos(this.frontDiameter / this.diameter);
    x = Math.sin(angle);
    let y = x * this.diameter / 2;

    this.topSurface = new Ellipse ({
      addTo: this,
      diameter: this.frontDiameter,
      translate: {z: y},
      stroke: this.stroke,
      fill: this.fill,
      color: this.frontFace || this.color,
      backface: this.color
    });
  }
  this.centroidFactor = .75 * (2*x*x - x*x*x*x) / (3*x - x*x*x);

  // composite shape, create child shapes
  this.apex = new Anchor({
    addTo: this,
    translate: { z: this.diameter / 2 },
  });
  // vector used for calculation
  this.renderCentroid = new Vector();
  this.tempVector = new Vector();
};

Hemisphere.prototype.updateSortValue = function() {
  // centroid of hemisphere is 3/8 between origin and apex
  this.renderCentroid.set( this.renderOrigin )
    .lerp( this.apex.renderOrigin, this.centroidFactor );
  this.sortValue = this.renderCentroid.z;
};

Hemisphere.prototype.render = function( ctx, renderer ) {
  this.renderDome( ctx, renderer );
  // call super
  Ellipse.prototype.render.apply( this, arguments );
};

Hemisphere.prototype.renderDome = function( ctx, renderer ) {
  if ( !this.visible ) {
    return;
  }
  var normalScale = this.renderNormal.magnitude();
  if (normalScale <= 0) {
    return;
  }
  // eccentricity
  var normalProjectedScale = this.renderNormal.magnitude2d();
  var cosEccenAngle = normalProjectedScale/normalScale;
  var eccenAngle = Math.acos( cosEccenAngle );
  var eccen = Math.sin( eccenAngle );

  var elem = this.getDomeRenderElement( ctx, renderer );
  var contourAngle = Math.atan2( this.renderNormal.y, this.renderNormal.x );
  var domeRadius = this.diameter / 2 * Math.sqrt(normalProjectedScale * normalProjectedScale + eccen * eccen)
  var baseRadius = this.tempVector.set(this.renderOrigin).subtract(this.pathCommands[0].renderPoints[0]).magnitude();

  var midAngle = 0;
  if (this.frontDiameter > 0) {
    var topRadius = this.tempVector.set(this.topSurface.renderOrigin).subtract(this.topSurface.pathCommands[0].renderPoints[0]).magnitude();
    var topSurfaceTop = topRadius * eccen;
    var topSurfaceHeight = this.tempVector.set(this.topSurface.renderOrigin).subtract(this.renderOrigin).magnitude() * cosEccenAngle;

    var b = domeRadius * topRadius;
    var b2 = b * b;
    var a2 = baseRadius * baseRadius * topSurfaceTop * topSurfaceTop
    var bc = b * topSurfaceHeight * topRadius;
    if (a2 != b2) {
      let m = bc / (b2 - a2);
      if (m <= 1) {
        midAngle = Math.acos(m);
      }
    }
  }

  var x = this.renderOrigin.x;
  var y = this.renderOrigin.y;

  if ( renderer.isCanvas ) {
    // canvas
    ctx.beginPath();
    ctx.ellipse( x, y, domeRadius, baseRadius, contourAngle, TAU/4, TAU / 2 - midAngle );
    ctx.ellipse( x, y, domeRadius, baseRadius, contourAngle, TAU / 2 + midAngle, 3 * TAU / 4 );
  } else if ( renderer.isSvg ) {
    // svg
    contourAngle = ( contourAngle - TAU/4 ) / TAU * 360;
    var endX = baseRadius * Math.sin(TAU / 2 - midAngle);
    var endY = domeRadius * Math.cos(TAU / 2 - midAngle);
    this.domeSvgElement.setAttribute( 'd', 'M ' + -baseRadius + ',0'
      + ' A ' + baseRadius + ',' + domeRadius + ' 0 0 1 ' + -endX + ',' + endY
      + ' H ' + endX
      + ' A ' + baseRadius + ',' + domeRadius + ' 0 0 1 ' + baseRadius + ', 0');
    this.domeSvgElement.setAttribute( 'transform',
        'translate(' + x + ',' + y + ' ) rotate(' + contourAngle + ')' );
  }

  renderer.stroke( ctx, elem, this.stroke, this.color, this.getLineWidth() );
  renderer.fill( ctx, elem, this.fill, this.color );
  renderer.end( ctx, elem );
};

var svgURI = 'http://www.w3.org/2000/svg';

Hemisphere.prototype.getDomeRenderElement = function( ctx, renderer ) {
  if ( !renderer.isSvg ) {
    return;
  }
  if ( !this.domeSvgElement ) {
    // create svgElement
    this.domeSvgElement = document.createElementNS( svgURI, 'path' );
    this.domeSvgElement.setAttribute( 'stroke-linecap', 'round' );
    this.domeSvgElement.setAttribute( 'stroke-linejoin', 'round' );
  }
  return this.domeSvgElement;
};

return Hemisphere;

} ) );
