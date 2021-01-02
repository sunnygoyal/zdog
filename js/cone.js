/**
 * Cone composite shape
 */

( function( root, factory ) {
  // module definition
  if ( typeof module == 'object' && module.exports ) {
    // CommonJS
    module.exports = factory( require('./boilerplate'), require('./vector'),
        require('./path-command'), require('./anchor'), require('./ellipse') );
  } else {
    // browser global
    var Zdog = root.Zdog;
    Zdog.Cone = factory( Zdog, Zdog.Vector, Zdog.PathCommand,
        Zdog.Anchor, Zdog.Ellipse );
  }
}( this, function factory( utils, Vector, PathCommand, Anchor, Ellipse ) {

var Cone = Ellipse.subclass({
  length: 1,
  fill: true,
  frontDiameter : 0,
  frontFace: undefined,
});

var TAU = utils.TAU;

Cone.prototype.create = function( /* options */) {
  // call super
  Ellipse.prototype.create.apply( this, arguments );
  // composite shape, create child shapes
  if (this.frontDiameter >= this.diameter) {
    throw "frontDiameter should be < diameter"
  } else {
    this.frontDiameter = Math.max(this.frontDiameter, 0);
  }

  var ratio = this.diameter / (this.diameter - this.frontDiameter);
  var projectedLength = ratio * this.length ;
  this.centroidFactor = this.diameter == 0 ? 1/3 : (this.diameter + 2 * this.frontDiameter) / ((this.diameter + this.frontDiameter) * 3 * ratio);

  this.apex = new Anchor({
    addTo: this,
    translate: { z: projectedLength },
  });

  if (this.frontDiameter > 0) {
    this.topSurface = new Ellipse ({
      addTo: this,
      diameter: this.frontDiameter,
      translate: {z: this.length},
      stroke: this.stroke,
      fill: this.fill,
      color: this.frontFace || this.color,
      backface: this.color
    });
  }

  // vectors used for calculation
  this.renderApex = new Vector();
  this.renderCentroid = new Vector();
  this.tangent = new Vector();
  this.baseVector = new Vector();

  this.surfacePathCommands = [
    new PathCommand( 'move', [ {} ] ), // points set in renderConeSurface
    new PathCommand( 'line', [ {} ] ),
    new PathCommand( 'line', [ {} ] ),
    new PathCommand( 'line', [ {} ] ),
  ];
};

Cone.prototype.updateSortValue = function() {
  // center of cone is one third of its length
  this.renderCentroid.set( this.renderOrigin )
    .lerp( this.apex.renderOrigin, this.centroidFactor );
  this.sortValue = this.renderCentroid.z;
};

Cone.prototype.render = function( ctx, renderer ) {
  this.renderConeSurface( ctx, renderer );
  Ellipse.prototype.render.apply( this, arguments );
};

Cone.prototype.renderConeSurface = function( ctx, renderer ) {
  if ( !this.visible ) {
    return;
  }
  this.renderApex.set( this.apex.renderOrigin )
    .subtract( this.renderOrigin );

  var scale = this.renderNormal.magnitude();
  var apexDistance = this.renderApex.magnitude2d();
  var normalDistance = this.renderNormal.magnitude2d();
  // eccentricity
  var eccenAngle = Math.acos( normalDistance/scale );
  var eccen = Math.sin( eccenAngle );
  var radius = this.baseVector.set(this.renderOrigin).subtract(this.pathCommands[0].renderPoints[0]).magnitude();

  // does apex extend beyond eclipse of face
  var isApexVisible = radius * eccen < apexDistance;
  if ( !isApexVisible ) {
    return;
  }
  // update tangents
  var apexAngle = Math.atan2( this.renderNormal.y, this.renderNormal.x ) + TAU/2;
  var projectLength = apexDistance/eccen;
  var projectAngle = Math.acos( radius/projectLength );

  // set tangent points
  this.setSurfaceRenderPoint( 0, 3, this.renderOrigin, projectAngle, radius, eccen, apexAngle);

  if (this.frontDiameter > 0) {
    var radius2 = this.baseVector.set(this.topSurface.renderOrigin).subtract(this.topSurface.pathCommands[0].renderPoints[0]).magnitude();
    this.setSurfaceRenderPoint( 1, 2, this.topSurface.renderOrigin, projectAngle, radius2, eccen, apexAngle);
  } else {
    this.surfacePathCommands[ 1 ].renderPoints[0].set( this.apex.renderOrigin );
    this.surfacePathCommands[ 2 ].renderPoints[0].set( this.apex.renderOrigin );
  }

  // render
  var elem = this.getSurfaceRenderElement( ctx, renderer );
  renderer.renderPath( ctx, elem, this.surfacePathCommands );
  renderer.stroke( ctx, elem, this.stroke, this.color, this.getLineWidth() );
  renderer.fill( ctx, elem, this.fill, this.color );
  renderer.end( ctx, elem );
};

var svgURI = 'http://www.w3.org/2000/svg';

Cone.prototype.getSurfaceRenderElement = function( ctx, renderer ) {
  if ( !renderer.isSvg ) {
    return;
  }
  if ( !this.surfaceSvgElement ) {
    // create svgElement
    this.surfaceSvgElement = document.createElementNS( svgURI, 'path' );
    this.surfaceSvgElement.setAttribute( 'stroke-linecap', 'round' );
    this.surfaceSvgElement.setAttribute( 'stroke-linejoin', 'round' );
  }
  return this.surfaceSvgElement;
};

Cone.prototype.setSurfaceRenderPoint = function(index1, index2, origin, projectAngle, radius, eccen, apexAngle) {
  var x = Math.cos( projectAngle ) * radius * eccen;
  var y = Math.sin( projectAngle ) * radius;

  var tangent = this.tangent;
  tangent.x = x;
  tangent.y = y;
  tangent.rotateZ( apexAngle );
  tangent.add( origin );
  this.surfacePathCommands[ index1 ].renderPoints[0].set( tangent );

  tangent.x = x;
  tangent.y = -y;
  tangent.rotateZ( apexAngle );
  tangent.add( origin );
  this.surfacePathCommands[ index2 ].renderPoints[0].set( tangent );
};

return Cone;

} ) );
