// -------------------------- demo -------------------------- //

var canvas = document.querySelector('canvas');
var w = 48;
var h = 48;
var minWindowSize = Math.min( window.innerWidth, window.innerHeight );
var zoom = Math.floor( minWindowSize / w );
canvas.width = w * zoom;
canvas.height = h * zoom;

var isRotating = true;

var illo = new Illo({
  canvas: canvas,
  scale: 4,
  zoom: zoom,
  dragRotate: true,
  onDragStart: function() {
    isRotating = false;
  },
});

var tiltAngle = Math.asin(2/3);

var prism = new Anchor({
  addTo: illo,
});

// -- illustration shapes --- //

var RT2 = Math.sqrt(2);
var capLength = 6/RT2;
var sideLength =  2 / Math.cos( tiltAngle );
var sideZ = sideLength/2;

var cap = new Rect({
  width: capLength,
  height: capLength,
  addTo: prism,
  translate: { z: -sideZ },
  lineWidth: 2,
  color: 'white',
});

cap.copy({
  translate: { z: sideZ },
});

var side = new Shape({
  addTo: prism,
  path: [ { z: -1 }, { z: 1 } ],
  scale: sideZ,
  translate: { x: capLength/2, y: capLength/2 },
  lineWidth: 2,
  color: 'white',
});
side.copy({
  translate: { x: -capLength/2, y: capLength/2 },
});
side.copy({
  translate: { x: -capLength/2, y: -capLength/2 },
});
side.copy({
  translate: { x:  capLength/2, y: -capLength/2 },
});

// -- animate --- //

var t = 0;
var tSpeed = 1/90;


function animate() {
  // update
  if ( isRotating ) {
    var easeT = easeInOut( t, 3 );
    var turn = Math.floor( t );
    if ( turn === 0 ) {
      illo.rotate.z = lerp( TAU/8 * -3, TAU/8, easeT );
      illo.rotate.x = lerp( 0, tiltAngle, easeT );
    } else if ( turn == 1 ) {
      illo.rotate.x = lerp( -TAU/2, 0, easeT );
    }
    t += tSpeed;
  }

  illo.updateGraph();

  illo.renderGraph();
  requestAnimationFrame( animate );
}

animate();


// ----- inputs ----- //

document.querySelector('.reset-button').onclick = reset;

function reset() {
  t = 0;
  illo.rotate.set({});
  isRotating = true;
}