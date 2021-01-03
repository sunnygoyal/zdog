// ----- setup ----- //

var illoElem = document.querySelector('.illo');
var sceneSize = 96;
var TAU = Zdog.TAU;
var ROOT3 = Math.sqrt( 3 );
var ROOT5 = Math.sqrt( 5 );
var PHI = ( 1 + ROOT5 )/2;
var isSpinning = false;
var viewRotation = new Zdog.Vector();
var displaySize;

// colors
var eggplant = '#636';
var garnet = '#C25';
var orange = '#E62';
var gold = '#EA0';
var yellow = '#ED0';

var illo = new Zdog.Illustration({
  element: illoElem,
  scale: 8,
  resize: 'fullscreen',
  onResize: function( width, height ) {
    displaySize = Math.min( width, height );
    this.zoom = Math.floor( displaySize/sceneSize );
  },

});

var solids = [];

// ----- hourglass ----- //

( function() {

  var hourglass = new Zdog.Anchor({
    addTo: illo,
    translate: { x: 0, y: -4 },
  });

  solids.push( hourglass );

  var hemi = new Zdog.Hemisphere({
    diameter: 2,
    translate: { z: -1 },
    addTo: hourglass,
    color: garnet,
    backface: orange,
    stroke: .5,
    fill: false
  });

  hemi.copy({
    translate: { z: 1 },
    rotate: { y: TAU/2 },
    color: eggplant,
    backface: gold,
  });

} )();

// ----- sphere ----- //

// ( function() {

//   var sphere = new Zdog.Anchor({
//     addTo: illo,
//     translate: { x: -4, y: -4 },
//   });


//   var hemi = new Zdog.Hemisphere({
//     diameter: 2,
//     addTo: illo,
//     color: orange,
//     backface: eggplant,
//     stroke: false,
//     fill: true,
//   });
//   solids.push( hemi );

//   hemi.copy({
//     rotate: { y: TAU/2 },
//     color: eggplant,
//     backface: orange,
//   });

//   solids.push( hemi );

// } )();

// ----- animate ----- //

var keyframes = [
  { x:   0, y:   0 },
  { x:   0, y: TAU },
  { x: TAU, y: TAU },
];

var ticker = 0;
var cycleCount = 180;
var turnLimit = keyframes.length - 1;

function animate() {
  update();
  illo.renderGraph();
}

animate();

function update() {

  if ( isSpinning ) {
    var progress = ticker/cycleCount;
    var tween = Zdog.easeInOut( progress % 1, 4 );
    var turn = Math.floor( progress % turnLimit );
    var keyA = keyframes[ turn ];
    var keyB = keyframes[ turn + 1 ];
    viewRotation.x = Zdog.lerp( keyA.x, keyB.x, tween );
    viewRotation.y = Zdog.lerp( keyA.y, keyB.y, tween );
    ticker++;
  }

  solids.forEach( function( solid ) {
    solid.rotate.set( viewRotation );
  } );

  illo.updateGraph();
}

// ----- inputs ----- //

var dragStartRX, dragStartRY;

new Zdog.Dragger({
  startElement: illoElem,
  onDragStart: function() {
    isSpinning = false;
    dragStartRX = viewRotation.x;
    dragStartRY = viewRotation.y;
  },
  onDragMove: function( pointer, moveX, moveY ) {
    viewRotation.x = dragStartRX - ( moveY/displaySize * TAU );
    viewRotation.y = dragStartRY - ( moveX/displaySize * TAU );
    animate();
  },
});
