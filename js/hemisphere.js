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
});

var TAU = utils.TAU;

Hemisphere.prototype.create = function( /* options */) {
  // call super
  Ellipse.prototype.create.apply( this, arguments );
  // composite shape, create child shapes
  this.apex = new Anchor({
    addTo: this,
    translate: { z: this.diameter / 2 },
  });
  // vector used for calculation
  this.renderCentroid = new Vector();
  this.baseVector = new Vector();
};

Hemisphere.prototype.updateSortValue = function() {
  // centroid of hemisphere is 3/8 between origin and apex
  this.renderCentroid.set( this.renderOrigin )
    .lerp( this.apex.renderOrigin, 3/8 );
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
  var eccenAngle = Math.acos( normalProjectedScale/normalScale);
  var eccen = Math.sin( eccenAngle );

  var elem = this.getDomeRenderElement( ctx, renderer );
  var contourAngle = Math.atan2( this.renderNormal.y, this.renderNormal.x );
  var domeRadius = this.diameter / 2 * Math.sqrt(normalProjectedScale * normalProjectedScale + eccen * eccen)
  var baseRadius = this.baseVector.set(this.renderOrigin).subtract(this.pathCommands[0].renderPoints[0]).magnitude();

  var x = this.renderOrigin.x;
  var y = this.renderOrigin.y;

  if ( renderer.isCanvas ) {
    // canvas
    ctx.beginPath();
    ctx.ellipse( x, y, domeRadius, baseRadius, contourAngle, TAU/4, -TAU/4 );
  } else if ( renderer.isSvg ) {
    // svg
    contourAngle = ( contourAngle - TAU/4 ) / TAU * 360;
    this.domeSvgElement.setAttribute( 'd', 'M ' + -baseRadius + ',0 A ' +
        baseRadius + ',' + domeRadius + ' 0 0 1 ' + baseRadius + ',0' );
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
