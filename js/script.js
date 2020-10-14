import { EffectComposer } from './scripts/EffectComposer.js';
import { RenderPass } from './scripts/RenderPass.js';
import { ShaderPass } from './scripts/ShaderPass.js';
import { CopyShader } from './scripts/CopyShader.js';
import { FXAAShader } from './scripts/FXAAShader.js';
import { LineGeometry } from './scripts/LineGeometry.js';
import { Line2 } from './scripts/Line2.js';
import { LineMaterial } from './scripts/LineMaterial.js';
import { SelectionBox } from './scripts/SelectionBox.js';
import { SelectionHelper } from './scripts/SelectionHelper.js';
import RBush from './scripts/rbush/index.js'
import quickselect from './scripts/quickselect/index.js'
import Draw from './scripts/ol/interaction/Draw.js';

// import { GreatCircle } from './GreatCircle/GreatCircle.js';
// import {transformExtent} from 'ol/proj';


let bgcolor = 0xf3f3f3
let graphcolor = 0xffffff
let vertexcolor = 0x4CAF50
let edgecolor = 0x21bf73
let edgecolor_sec = 0x4cd995
let canvascolor = "#ffffff" // #c7c7c7
let contcolor = 0xff0000

// Extra colors
/*
// let bgcolor = 0xf3f3f3
// let graphcolor = 0xebe6e6
// let vertexcolor = 0x4CAF50
// let edgecolor = 0x21bf73
// let canvascolor = "#c7c7c7"

// let bgcolor = 0x512b58
// let graphcolor = 0x2c003e
// let vertexcolor = 0xfe346e
// let edgecolor = 0xd2fafb
// let canvascolor = "#2c003e"


// let bgcolor = 0xffc2c2
// let graphcolor = 0xff9d9d
// let vertexcolor = 0xff2e63
// let edgecolor = 0x010a43
// let canvascolor = "#ff9d9d"
*/

// TODO: Resize graph based on highest weight
// TODO: Optimization move lines instead of redrawing?
// TODO: Smoothen graph, check vertices very far from numbers, take average if so
// TODO: Discard opacityMap, redundant?

let T = THREE

let vertexCount = 0
let edgeCount = 0

let zoomWidths = []
let zoomHeights = []
let zoomLevels = []

let planeXMin = -10, planeXMax = 10
let planeYMin = -10, planeYMax = 10
let planeW = planeXMax - planeXMin
let planeH = planeYMax - planeYMin
let divisions = 50 // Was 150
let heightMap = Array(divisions).fill().map(() => Array(divisions).fill(0.0));
let opacityMap = Array(divisions).fill().map(() => Array(divisions).fill(0.0));
let calcHeightMap = Array(divisions).fill().map(() => Array(divisions).fill(0.0));

let vertexHeight = 3

let time = Date.now()

let dataSent = false

// ThreeJS Scene Setup

var scene = new T.Scene()
// var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 )
// var camera = new THREE.PerspectiveCamera( 25, window.innerWidth/window.innerHeight, 0.1, 1000 )
let div = 128
var camera = new THREE.OrthographicCamera( window.innerWidth/-div, window.innerWidth/div, window.innerHeight/div, window.innerHeight/-div, 0.1, 1000 )
camera.position.x = -15
camera.position.z = 20
camera.position.y = 15

var clock = new T.Clock()

var renderer = new THREE.WebGLRenderer( { logarithmicDepthBuffer: true, antialias: false } )
renderer.setSize( window.innerWidth, window.innerHeight )
renderer.autoClear = false;
renderer.setPixelRatio( window.devicePixelRatio )
// renderer.shadowMap.enabled = true;
// renderer.setClearColor()
document.body.appendChild( renderer.domElement )

scene.background = new THREE.Color(bgcolor)
var controls = new T.OrbitControls( camera, renderer.domElement );

const olMap = createMap()
const canv = document.createElement('canvas')
canv.id = "canvas-texture"
const ctx = canv.getContext('2d');
ctx.canvas.width = 2000;
ctx.canvas.height = 2000;
ctx.fillStyle = canvascolor;
ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
var texture = new T.CanvasTexture(ctx.canvas);
texture.minFilter = THREE.LinearFilter;

// let background = new Image()
// background.src = "./images/grayworld2.jpg"
// background.onload = function() {
//   ctx.drawImage(background,0,0)
//
// }

let ptGeom = new T.SphereGeometry(0.15, 32, 32)
let ptMat = new T.MeshBasicMaterial({color: vertexcolor})


let p1 = new T.Vector3(-1, 0, 3.5)
let p2 = new T.Vector3(1, 0, 3.5)
let p3 = new T.Vector3(0, -1, 2.4)

// let p1 = new T.Vector3(-1, -1.2, 3)
// let p2 = new T.Vector3(1, -1.2, 3)
// let p3 = new T.Vector3(0, -1.8, 2.4)

let newPt = new T.Mesh(ptGeom, ptMat)
newPt.position.y = p1.y
newPt.position.x = p1.x
newPt.position.z = p1.z
// scene.add(newPt)

newPt = new T.Mesh(ptGeom, ptMat)
newPt.position.y = p2.y
newPt.position.x = p2.x
newPt.position.z = p2.z
// scene.add(newPt)

newPt = new T.Mesh(ptGeom, ptMat)
newPt.position.y = p3.y
newPt.position.x = p3.x
newPt.position.z = p3.z
// scene.add(newPt)

var clipPlane = new T.Plane().setFromCoplanarPoints(p1, p2, p3)

let p4 = new T.Vector3(-1, 0, -3.5)
let p5 = new T.Vector3(1, 0, -3.5)
let p6 = new T.Vector3(0, -1, -3)

// let p1 = new T.Vector3(-1, -1.5, 3)
// let p2 = new T.Vector3(1, -1.5, 3)
// let p3 = new T.Vector3(0, -2, 2.4)

newPt = new T.Mesh(ptGeom, ptMat)
newPt.position.y = p4.y
newPt.position.x = p4.x
newPt.position.z = p4.z
// scene.add(newPt)

newPt = new T.Mesh(ptGeom, ptMat)
newPt.position.y = p5.y
newPt.position.x = p5.x
newPt.position.z = p5.z
// scene.add(newPt)

newPt = new T.Mesh(ptGeom, ptMat)
newPt.position.y = p6.y
newPt.position.x = p6.x
newPt.position.z = p6.z
// scene.add(newPt)

var clipPlane2 = new T.Plane().setFromCoplanarPoints(p6, p5, p4)

var clipPlane = new T.Plane(new T.Vector3(0, 2, 0), 2)
var clipPlane2 = new T.Plane(new T.Vector3(1, 0, 0), 7) // 5.5
var clipPlane3 = new T.Plane(new T.Vector3(-1, 0, 0), 7) // 6
var clipPlane4 = new T.Plane(new T.Vector3(0, 0, 1), 10) // 3.3
var clipPlane5 = new T.Plane(new T.Vector3(0, 0, -1), 10) // 3.3


var geometry = new T.PlaneGeometry(planeW, planeH, divisions-1, divisions-1)
var contGeom = new T.PlaneGeometry(planeW/2, planeH/2, divisions-1, divisions-1)
var material = new T.MeshBasicMaterial( { color: graphcolor, side: T.DoubleSide} )
var contMat = new T.MeshBasicMaterial( { color: contcolor, side: T.DoubleSide} )
var planeMat = new THREE.MeshPhongMaterial( { color: graphcolor, clippingPlanes: [clipPlane2, clipPlane3, clipPlane4, clipPlane5], vertexColors: T.VertexColors, side: THREE.DoubleSide,  flatShading: false, shininess: 0, wireframe: false, map: texture} )
let transparentMat = new T.MeshLambertMaterial({visible: false})
let mMat = [planeMat, transparentMat]
var plane = new T.Mesh( geometry, mMat )

// for (let i = -1 ; i < 1 ; i+= 0.4) {
//   let contourPlane = new T.Mesh(contGeom, contMat)
//   contourPlane.rotation.set(-1.57, 0, 0)
//   contourPlane.position.set(0, i, 0)
//   scene.add(contourPlane)
// }
// plane.receiveShadow = true
// plane.castShadow = true
plane.rotation.set(-Math.PI/2, 0, 0.)
scene.add( plane )


controls.update();


let light = new T.PointLight( 0xffffff, 0.5)
light.position.set(-7, 10, 0)
scene.add(light)

var alight = new THREE.AmbientLight( 0x404040 ); // soft white light
scene.add( alight );

// Extra lights
/**
// s1 - (0, 10, 0)  | intensity 1   | 0xebe6e6
// s4 - (0, 10, 0)  | intensity 1   | white
// s5 - (0, 10, 0)  | intensity 1.1 | white
// s6 - (-7, 10, 0) | intensity 1.1 | white
// s7 - (0, 10, 5)  | intensity 1.1 | white
// s8 - (-7, 10, 0) | intensity 1   | white

// var alight = new THREE.AmbientLight( 0x404040 ); // soft white light
// scene.add( alight );

// const dlight = new THREE.DirectionalLight(0xffffff, 1);
// dlight.castShadow = true;
// dlight.position.set(0, 5, -20);
// dlight.target.position.set(0, 0, 0);
// scene.add(dlight);
// scene.add(dlight.target);

// var directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
// directionalLight.castShadow = true
// directionalLight.position.set(0, 2,3)
// scene.add( directionalLight );


// let light2 = new T.PointLight( 0xffffff, 3.5)
// light2.position.set(0, -2, 20)
// scene.add(light2)


// let light3 = new T.PointLight( 0xffffff, 1, 100)
// light3.position.set(0, 10, -10)
// scene.add(light3)
//
// let light4 = new T.PointLight( 0xffffff, 1, 100)
// light4.position.set(-10, 10, 10)
// scene.add(light4)
//
// let light2 = new T.PointLight( 0xffffff, 1, 100)
// light2.position.set(0, -10, 10)
// scene.add(light2)
**/

let vertices = {}
let edges = {}
let edgeCollection = []
let names = {}
let linesDrawn = []
let subPlanes = []

// edgecolor_sec = 0x6decaf
edgecolor_sec = 0x2cc57c
edgecolor = 0x178e51

var lineMat = new T.LineBasicMaterial({color: edgecolor, linewidth: 6, clippingPlanes: [clipPlane] })
// var lineMatSec = new T.LineBasicMaterial({color: edgecolor, linewidth: 4, opacity: 0.3, transparent: true})
var lineMatSec = new T.LineBasicMaterial({color: edgecolor_sec, linewidth: 1.5, depthFunc: T.LessDepth})
// var matLine

var contourMeshLines = []
var contourCount = -1



plane.geometry.dynamic = true

for (let face of plane.geometry.faces) {
  face.vertexColors[0] = new T.Color(0xffffff)
  face.vertexColors[1] = new T.Color(0xffffff)
  face.vertexColors[2] = new T.Color(0xffffff)
}

var renderPass = new RenderPass( scene, camera );

var contX = []
var contY = []
for (let i = 0 ; i < heightMap.length ; i++) {
  contX.push(i)
  contY.push(i)
}

// Composers and FXAA shader
{
  var composer1, composer2, fxaaPass;

  fxaaPass = new ShaderPass( FXAAShader );
  fxaaPass.renderToScreen = false

  var pixelRatio = renderer.getPixelRatio();

  fxaaPass.material.uniforms[ 'resolution' ].value.x = 1 / ( window.innerWidth * pixelRatio );
  fxaaPass.material.uniforms[ 'resolution' ].value.y = 1 / ( window.innerHeight * pixelRatio );

  composer1 = new EffectComposer( renderer );
  composer1.addPass( renderPass );
  composer1.addPass( fxaaPass );

  //

  var copyPass = new ShaderPass( CopyShader );

  composer2 = new EffectComposer( renderer );
  composer2.addPass( renderPass );
  composer2.addPass( copyPass );
}




window.onload = function() {


  var mapCanvas = document.getElementById('map').getElementsByTagName('canvas')[0]

  // mapCanvas.style.transform = "rotate(90deg)"
  const ctx = mapCanvas.getContext('2d')
  // ctx.canvas.width = 2000;
  // ctx.canvas.height = 2000;
  // ctx.fillStyle = canvascolor;
  // ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  const customTexture = texture
  const mapTexture = new T.CanvasTexture(ctx.canvas)
  mapTexture.minFilter = THREE.LinearFilter
  mapTexture.magFilter = THREE.NearestFilter
  mapTexture.center = new T.Vector2(0.5, 0.5)
  mapTexture.rotation = -Math.PI/2

  var mapdiv = document.getElementById("map")

  mapdiv.style.display = "none"

  // TODO: Stack for -ve zoom levels for consistency

  // TODO: enable
  window.addEventListener('wheel', function(e){
    mapdiv.style.display = "block"
    if (e.deltaY > 0) {
      if (zoomLevels.length != 0) {
        mapdiv.style.width = zoomWidths.pop() + 'px'
        mapdiv.style.height = zoomHeights.pop() + 'px'
        olMap.updateSize()
        olMap.getView().setZoom(zoomLevels.pop())
      }

      // olMap.getView().setCenter(ol.proj.fromLonLat([87.6, 41.8]))
    } else {
      zoomWidths.push(mapdiv.offsetWidth)
      zoomHeights.push(mapdiv.offsetHeight)
      zoomLevels.push(olMap.getView().getZoom())
      olMap.getView().setZoom(olMap.getView().getZoom()+0.05)
      mapdiv.style.width = mapdiv.offsetWidth*1.05 + 'px'
      mapdiv.style.height = mapdiv.offsetHeight*1.05 + 'px'
      olMap.updateSize()

      // olMap.getView().setCenter(ol.proj.fromLonLat([87.6, 41.8]))
    }
    mapdiv.style.display = "none"
  }, true)

  var dropNodes = document.getElementById('drop-nodes');
  dropNodes.addEventListener('dragover', dragOver, false);
  dropNodes.addEventListener('drop', fileSelectNodes, false);

  var dropEdges = document.getElementById('drop-edges');
  dropEdges.addEventListener('dragover', dragOver, false);
  dropEdges.addEventListener('drop', fileSelectEdges, false);

  let btnAddVertex = document.getElementById("btn-add-vertex")
  btnAddVertex.onclick = addVertex

  let btnAddEdge  = document.getElementById("btn-add-edge")
  btnAddEdge.onclick = addEdge

  document.getElementById("heatmap-div").style.display = "none"

  let hideSurface = document.getElementById("hide-surface")
  let chkCalcSurface = document.getElementById("use-calc-surface")
  let showMap = document.getElementById("show-map")


  let vertexControlDiv = document.getElementById("div-vertex")
  // vertexControlDiv.style.display = "none"

  let edgeControlDiv = document.getElementById("div-edge")
  // edgeControlDiv.style.display = "none"

  let btnGenGraph = document.getElementById("btn-gen-graph")
  btnGenGraph.onclick = generateGraph

  let btnGenGraphEmpty = document.getElementById("btn-gen-graph-empty")
  btnGenGraphEmpty.onclick = generateGraphNoWeights

  let btnCalcCurv = document.getElementById("btn-calc-curv")
  btnCalcCurv.onclick = calculateCurvature

  document.getElementById("btn-calc-surface").onclick = calcSurface

  // Set up opacity map for hiding surface
  let xlimit = 50
  let ylimit = 30
  for (let j = ylimit ; j < heightMap[0].length - ylimit ; j++) {

    let factor = 0
    // factor = (Math.abs((heightMap[0].length/2) - j) / (heightMap[0].length/2-ylimit))**(1/10)
    // // factor = (ylimit - j)**2
    // factor = 1-factor
    // // factor /= 3
    // console.log(factor)
    // if (factor > 0.3)
    //   factor = 0.3
    let limit = xlimit
    // if (j > heightMap[0].length/2-25 && j < heightMap[0].length/2+25) {
    //   limit = 50
    //   // factor = Math.abs((heightMap[0].length/2) - j) / (heightMap[0].length/2)
    //   // factor = 1-factor
    //   // factor /= 4
    // }
    for (let i = limit + Math.floor(limit*factor) ; i <= heightMap.length - limit - (limit*factor) ; i++) {
      opacityMap[i][j] = 1
    }
  }


  var animate = function () {
    if (showMap.checked) {
      plane.material[0].map = mapTexture
      texture = mapTexture
    } else {
      plane.material[0].map = customTexture
      texture = customTexture
    }
    plane.material[0].needsUpdate = true

  	requestAnimationFrame( animate )

    controls.update()
    // controls.enabled = false
    controls.enablePan = false
    controls.enableRotate = true
    controls.enableZoom = true
    controls.minZoom = 1



    // Clear lines, heights, reset textures
    for (let line of linesDrawn) {
      scene.remove(line)
    }
    linesDrawn = []

    heightMap = Array(divisions).fill().map(() => Array(divisions).fill(0.))


    ctx.fillStyle = canvascolor
    // ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    // if (!showMap.checked) {
    //   ctx.drawImage(background,0,0,697,998,250,-10,1650,2080) // 696x995
    // }




    let viewSeperate = false
    // let vertices_visual = vertices, edges_visual = edges
    // if (viewSeperate) {
    //   vertices_visual = vertices2
    //   edges_visual = edges2
    // }
    let current_edges = {...edges}
    if (edgeCollection.length > 0)
      current_edges = {...edgeCollection[document.getElementById("threshold-slider").value]}
    // console.log(document.getElementById("threshold-slider").value)
    // console.log(document.getElementById("posrange-slider").value)

    // Graph 2
    // 0-A - -5, 0
    // 1-B - -4.5, -1
    // 2-C - -3.5, 0.5
    // 3-E - -3, 0 // Skip D
    // 4-F - -1.5, 0
    // 5-G - 2.4, 0.5
    // 6-H - 2.4, -0.5
    // 7-I - 3.5, 0.8
    // 8-J - 4, 3

    // let logical_edges = [[1, 6, null, null], [4, 7, 1, -0.5], [0, 8, 2, -0.8], [2, 8, 2, -0.7], [2, 5, 0.5, -0.8]]
    // let logical_edges = [[1, 6, null, null], [4, 7, 1.2, -0.3], [0, 8, 1.6, -0.3], [2, 8, 1.6, -0.3], [2, 5, 1.2, -0.3]]
    // let logical_edges = [[1, 6, null, null], [4, 7, 0.2, -0.3], [0, 8, 0.6, -0.3], [2, 8, 0.6, -0.3], [2, 5, 0.2, -0.3]]
    let logical_edges = []


    ctx.setLineDash([])

    // Draw physical graph edge, texture edge
    for (let id in current_edges) {
      let edge = current_edges[id]
      // console.log(`${edge.start.lat}, ${edge.start.long}, ${edge.end.lat}, ${edge.end.long}`)
      // console.log(edge.start)
      // if (edge.start.name != "Tokyo")
      //   continue
      // Draw graph edge
      if (edge.split) {
        // Create split edges
        let eSize = Object.keys(current_edges).length
        let end1 = {mesh: {position: {x: parseFloat(edge.end.mesh.position.x), z: parseFloat(edge.end.mesh.position.z)+20}}}
        let edge1 = new EdgeObj(eSize, edge.start, end1, edge.weight)
        drawEdge(edge1, lineMat)
        let startPt = [parseFloat(edge1.start.mesh.position.x), parseFloat(edge1.start.mesh.position.z)]
        let endPt = [parseFloat(edge1.end.mesh.position.x), parseFloat(edge1.end.mesh.position.z)]

        // Draw texture edge // TODO: undo
        // startPt = [(startPt[0] - planeXMin) * ctx.canvas.width / planeW, (startPt[1] - planeYMin) * ctx.canvas.height / planeH]
        // endPt = [(endPt[0] - planeXMin) * ctx.canvas.width / planeW, (endPt[1] - planeYMin) * ctx.canvas.height / planeH]
        // ctx.beginPath();
        // ctx.moveTo(startPt[0], startPt[1])
        // ctx.lineTo(endPt[0], endPt[1])
        // ctx.strokeStyle = "#1D84B5" // #2cacc9 // #40bad5
        // ctx.lineWidth = 12
        // ctx.stroke()

        let start2 = {mesh: {position: {x: parseFloat(edge.start.mesh.position.x), z: parseFloat(edge.start.mesh.position.z)-20}}}
        let edge2 = new EdgeObj(eSize+1, start2, edge.end, edge.weight)
        drawEdge(edge2, lineMat)
        startPt = [parseFloat(edge2.start.mesh.position.x), parseFloat(edge2.start.mesh.position.z)]
        endPt = [parseFloat(edge2.end.mesh.position.x), parseFloat(edge2.end.mesh.position.z)]

        // Draw texture edge // TODO: undo
        // startPt = [(startPt[0] - planeXMin) * ctx.canvas.width / planeW, (startPt[1] - planeYMin) * ctx.canvas.height / planeH]
        // endPt = [(endPt[0] - planeXMin) * ctx.canvas.width / planeW, (endPt[1] - planeYMin) * ctx.canvas.height / planeH]
        // ctx.beginPath();
        // ctx.moveTo(startPt[0], startPt[1])
        // ctx.lineTo(endPt[0], endPt[1])
        // ctx.strokeStyle = "#1D84B5" // #2cacc9 // #40bad5
        // ctx.lineWidth = 12
        // ctx.stroke()

        current_edges[eSize] = edge1
        current_edges[eSize+1] = edge2
        continue
        // Add split edge to current edges
        // Skip split edges in setHeights
      }
      drawEdge(edge, lineMat)

      let startPt = [parseFloat(edge.start.mesh.position.x), parseFloat(edge.start.mesh.position.z)]
      let endPt = [parseFloat(edge.end.mesh.position.x), parseFloat(edge.end.mesh.position.z)]

      // Draw texture edge // TODO: undo
      startPt = [(1 - (startPt[0] - planeXMin) / planeW) * ctx.canvas.width, (startPt[1] - planeYMin) * ctx.canvas.height / planeH]
      endPt = [(1 - (endPt[0] - planeXMin) / planeW) * ctx.canvas.width, (endPt[1] - planeYMin) * ctx.canvas.height / planeH]
      ctx.beginPath();
      ctx.moveTo(startPt[1], startPt[0])
      ctx.lineTo(endPt[1], endPt[0])
      ctx.strokeStyle = "#660000" // #2cacc9 // #40bad5
      ctx.lineWidth = 2
      ctx.stroke()
    }

    // Draw logical edges into graph, Draw logical edges into texture
    for (let ids of logical_edges) {
      // for (let id2 in vertices_visual) {
      //   if (id < id2) {
      //     continue
      //   }
      let id = ids[0]
      let id2 = ids[1]

      let startPt = [parseFloat(vertices_visual[id].mesh.position.x), parseFloat(vertices_visual[id].mesh.position.z)]
      let endPt = [parseFloat(vertices_visual[id2].mesh.position.x), parseFloat(vertices_visual[id2].mesh.position.z)]

      startPt = [(startPt[0] - planeXMin) * ctx.canvas.width / planeW, (startPt[1] - planeYMin) * ctx.canvas.height / planeH]
      endPt = [(endPt[0] - planeXMin) * ctx.canvas.width / planeW, (endPt[1] - planeYMin) * ctx.canvas.height / planeH]

      ctx.setLineDash([])
      ctx.beginPath();
      ctx.moveTo(startPt[0], startPt[1])
      if (ids[2] == null) {
        ctx.lineTo(endPt[0], endPt[1])
        ctx.strokeStyle = "#2cacc9" //  #235789 // #68c8de // #5ecfe2  // #9f9f9f
        ctx.lineWidth = 4
        ctx.stroke()
      } else {
        let ctrlPt = [ids[2], ids[3]]
        ctrlPt = [(ctrlPt[0] - planeXMin) * ctx.canvas.width / planeW, (ctrlPt[1] - planeYMin) * ctx.canvas.height / planeH]
        // ctx.quadraticCurveTo(ctrlPt[0], ctrlPt[1], endPt[0], endPt[1])
        ctx.bezierCurveTo(ctrlPt[0], ctrlPt[1], ctrlPt[0], ctrlPt[1], endPt[0], endPt[1])

        ctx.strokeStyle = "#2cacc9" //  #235789 // #68c8de // #5ecfe2  // #9f9f9f
        ctx.lineWidth = 4
        ctx.stroke()

        // ctjcmathews2 ;
      }





      drawEdge(new EdgeObj(null, vertices_visual[id], vertices_visual[id2], null), lineMatSec)
      // }
    }


    // Set height map for +ve edges
    for (let id in current_edges) {
      let edge = current_edges[id]
      if (edge.weight < 0)
        continue

      let startPt = [parseFloat(edge.start.mesh.position.x), parseFloat(edge.start.mesh.position.z)]
      let endPt = [parseFloat(edge.end.mesh.position.x), parseFloat(edge.end.mesh.position.z)]

      let midPt = [(startPt[0] + endPt[0]) / 2, (startPt[1] + endPt[1]) / 2]
      midPt[0] = (midPt[0] - planeXMin)// Change from (min,max) to (0, newmax)
      midPt[1] = (midPt[1] - planeYMin)// Change from (min,max) to (0, newmax)

      midPt[0] = Math.round((midPt[0] / planeW) * divisions) // Change from (0, planeWidth) to (0, divisions)
      midPt[1] = Math.round((midPt[1] / planeH) * divisions) // Change from (0, planeHeight) to (0, divisions)

      let newMidPt = {x: 0, y: 0}
      newMidPt.x = midPt[0]
      newMidPt.y = midPt[1]

      let newEndPt = {x: 0, y: 0}
      newEndPt.x = endPt[0]
      newEndPt.y = endPt[1]
      newEndPt.x = (newEndPt.x - planeXMin)// Change from (min,max) to (0, newmax)
      newEndPt.y = (newEndPt.y - planeYMin)// Change from (min,max) to (0, newmax)

      newEndPt.x = Math.round((newEndPt.x / planeW) * divisions) // Change from (0, planeWidth) to (0, divisions)
      newEndPt.y = Math.round((newEndPt.y / planeH) * divisions) // Change from (0, planeHeight) to (0, divisions)

      let newStartPt = {x: 0, y: 0}
      newStartPt.x = startPt[0]
      newStartPt.y = startPt[1]
      newStartPt.x = (newStartPt.x - planeXMin)// Change from (min,max) to (0, newmax)
      newStartPt.y = (newStartPt.y - planeYMin)// Change from (min,max) to (0, newmax)

      newStartPt.x = Math.round((newStartPt.x / planeW) * divisions) // Change from (0, planeWidth) to (0, divisions)
      newStartPt.y = Math.round((newStartPt.y / planeH) * divisions) // Change from (0, planeHeight) to (0, divisions)


      // Set heightmap
      setHeights(newStartPt, newMidPt, newEndPt, edge.weight)
    }


    // smoothHeightMap()
    // smoothHeightMap()
    // smoothHeightMap()
    // smoothHeightMap()


    // Set height map for -ve edges
    for (let id in current_edges) {
      let edge = current_edges[id]
      if (edge.weight >= 0)
        continue

      let startPt = [parseFloat(edge.start.mesh.position.x), parseFloat(edge.start.mesh.position.z)]
      let endPt = [parseFloat(edge.end.mesh.position.x), parseFloat(edge.end.mesh.position.z)]

      let midPt = [(startPt[0] + endPt[0]) / 2, (startPt[1] + endPt[1]) / 2]
      midPt[0] = (midPt[0] - planeXMin)// Change from (min,max) to (0, newmax)
      midPt[1] = (midPt[1] - planeYMin)// Change from (min,max) to (0, newmax)

      midPt[0] = Math.round((midPt[0] / planeW) * divisions) // Change from (0, planeWidth) to (0, divisions)
      midPt[1] = Math.round((midPt[1] / planeH) * divisions) // Change from (0, planeHeight) to (0, divisions)

      let newMidPt = {x: 0, y: 0}
      newMidPt.x = midPt[0]
      newMidPt.y = midPt[1]

      let newEndPt = {x: 0, y: 0}
      newEndPt.x = endPt[0]
      newEndPt.y = endPt[1]
      newEndPt.x = (newEndPt.x - planeXMin)// Change from (min,max) to (0, newmax)
      newEndPt.y = (newEndPt.y - planeYMin)// Change from (min,max) to (0, newmax)

      newEndPt.x = Math.round((newEndPt.x / planeW) * divisions) // Change from (0, planeWidth) to (0, divisions)
      newEndPt.y = Math.round((newEndPt.y / planeH) * divisions) // Change from (0, planeHeight) to (0, divisions)

      let newStartPt = {x: 0, y: 0}
      newStartPt.x = startPt[0]
      newStartPt.y = startPt[1]
      newStartPt.x = (newStartPt.x - planeXMin)// Change from (min,max) to (0, newmax)
      newStartPt.y = (newStartPt.y - planeYMin)// Change from (min,max) to (0, newmax)

      newStartPt.x = Math.round((newStartPt.x / planeW) * divisions) // Change from (0, planeWidth) to (0, divisions)
      newStartPt.y = Math.round((newStartPt.y / planeH) * divisions) // Change from (0, planeHeight) to (0, divisions)

      setHeights(newStartPt, newMidPt, newEndPt, edge.weight)
    }


    // smoothHeightMap()
    // smoothHeightMap()
    // smoothHeightMap()
    // smoothHeightMap()

    // TODO: enable

    // Draw point on surface texture
    for (let id in vertices) {
      let vertex = vertices[id]
      let point = [parseFloat(vertex.mesh.position.x), parseFloat(vertex.mesh.position.z)]
      point = [(1 - (point[0] - planeXMin) / planeW) * ctx.canvas.width, (point[1] - planeYMin) * ctx.canvas.height / planeH]
      ctx.fillStyle = "#FF5C5C" // #035aa6

      ctx.beginPath();
      ctx.arc(point[1], point[0], 5, 0, 2 * Math.PI);
      ctx.fill();
    }

    texture.needsUpdate = true

    // Set plane vertices' height
    let map = null
    if (chkCalcSurface.checked)
      map = calcHeightMap
    else
      map = heightMap
    let ex = 0.3
    let direction = new T.Vector3(0, 1, 0)
    for (let i=0; i<divisions ; i++) {
      for (let j=0; j < divisions ; j++) {
        if (i < 2) {
          plane.geometry.vertices[i*divisions+j].z =  map[3][j]
        } else if (i >= divisions-2) {
          plane.geometry.vertices[i*divisions+j].z =  map[divisions-3][j]
        } else {
          plane.geometry.vertices[i*divisions+j].z =  map[i][j]
        }
      }
    }

    for (let p of subPlanes) {
      for (let i=p.start[0]; i<p.end[0] ; i++) {
        for (let j=p.start[1]; j<p.end[1] ; j++) {
          plane.geometry.vertices[j*divisions+i].z = 0
        }
      }
      p.plane.material.map.needsUpdate = true
    }


    // Set materials for plane faces, to hide unwanted

    for (let face of plane.geometry.faces) {
      let z1 = plane.geometry.vertices[face.a].z
      let z2 = plane.geometry.vertices[face.b].z
      let z3 = plane.geometry.vertices[face.c].z
      let hide = false
      let v = face.a
      let i = v/divisions
      let j = v%divisions
      // if (z1 > 1)
      //   face.vertexColors[0].setHSL( 1, 0, 0.5);
      // if (z2 > 1)
      //   face.vertexColors[1].setHSL( 1, 0, 0.5);
      // if (z3 > 1)
      //   face.vertexColors[2].setHSL( 1, 0, 0.5);
      // face.vertexColors[0].setHSL( 1, 0, Math.floor(z1*10)/10);
      // face.vertexColors[1].setHSL( 1, 0, Math.floor(z2*10)/10);
      // face.vertexColors[2].setHSL( 1, 0, Math.floor(z3*10)/10);

      // face.vertexColors[0].setHSL(Math.random(), 0.5, 0.5)
      // face.vertexColors[0] = new T.Color( 0xff00ff )
      // if ((i < xlimit || i > heightMap.length - xlimit) || (j < ylimit || j > heightMap[0].length - ylimit))
      //   hide = true
      if (opacityMap[Math.floor(i)][Math.floor(j)] == 0)
        hide = true
      v = face.b
      i = v/divisions
      j = v%divisions
      if (opacityMap[Math.floor(i)][Math.floor(j)] == 0)
        hide = true
      // if ((i < xlimit || i > heightMap.length - xlimit) || (j < ylimit || j > heightMap[0].length - ylimit))
      //   hide = true
      v = face.c
      i = v/divisions
      j = v%divisions
      if (opacityMap[Math.floor(i)][Math.floor(j)] == 0)
        hide = true
      // if ((i < xlimit || i > heightMap.length - xlimit) || (j < ylimit || j > heightMap[0].length - ylimit))
      //   hide = true
      if (false && hideSurface.checked && Math.abs(z1) == 0 && Math.abs(z2) == 0 && Math.abs(z3) == 0) {
        face.materialIndex = 1 // Transparent
      } else if (false && hideSurface.checked && (Math.abs(z2-z1) > 0.5 || Math.abs(z3-z1) > 0.5)) { // Extra condition for tests
        face.materialIndex = 1
      } else if (false && hideSurface.checked && (Math.abs(z2-z1) + Math.abs(z3-z1) + Math.abs(z3-z2) > 0.8)) { // Extra condition for tests
        face.materialIndex = 1
      } else if (false && hideSurface.checked && (z1 == 0 || z2 == 0 || z3 == 0)) { // Extra condition for tests // Was true
        face.materialIndex = 1
      } else if (false && hide && hideSurface.checked) {
        face.materialIndex = 1
      } else if (false && hideSurface.checked && (z1 < -2.4 || z2 < -2.4 || z3 < -2.4)) { // Inward edge
        face.materialIndex = 1
      } else {
        face.materialIndex = 0
      }
    }

    contourCount++

    if (dataSent) {
      // var xmlHttp = new XMLHttpRequest();
      // xmlHttp.onreadystatechange = function() {
      //   if(xmlHttp.readyState == 4 && xmlHttp.status == 200) {
      //     // console.log("recv dummy")
      //     // console.log(JSON.parse(xmlHttp.responseText))
      //     let data = JSON.parse(xmlHttp.responseText)
      //   }
      // }
      // xmlHttp.open("post", "dummy");
      // xmlHttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
      //
      // xmlHttp.send(JSON.stringify({"a": "b"}));
      // console.log("dummy data sent")
    }

    // calcContours(xlimit, ylimit)


    plane.geometry.groupsNeedUpdate = true
    plane.geometry.verticesNeedUpdate = true
    plane.geometry.colorsNeedUpdate = true
    plane.geometry.computeVertexNormals()


    // Render
    renderer.localClippingEnabled = hideSurface.checked

    // matLine.resolution.set( window.innerWidth, window.innerHeight );
    // renderer.setViewport( 0, 0, window.innerWidth/2, window.innerHeight );
    composer1.render()
    // renderer.render( scene, camera )
    // renderer.setViewport( window.innerWidth/2, 0, window.innerWidth/2, window.innerHeight );
    // composer2.render()

  };

  animate();
}

var selectionBox = new SelectionBox( camera, scene );
var helper = new SelectionHelper( selectionBox, renderer, 'selectBox' );

document.addEventListener( 'pointerdown', function ( event ) {
  if (event.which != 3)
    return
  for ( var item of selectionBox.collection ) {
    if (Array.isArray(item.material))
      continue
    item.material = item.material.clone()
    item.material.color.set( 0x4CAF50 )


  }

  selectionBox.startPoint.set(
  	( event.clientX / window.innerWidth ) * 2 - 1,
  	- ( event.clientY / window.innerHeight ) * 2 + 1,
  	0.5 );

} );

document.addEventListener( 'pointermove', function ( event ) {
	if ( helper.isDown ) {
		for ( var i = 0; i < selectionBox.collection.length; i ++ ) {
      if (Array.isArray(selectionBox.collection[i].material))
        continue
      selectionBox.collection[i].material = selectionBox.collection[i].material.clone()
			selectionBox.collection[i].material.color.set( 0x4CAF50 );

		}

		selectionBox.endPoint.set(
			( event.clientX / window.innerWidth ) * 2 - 1,
			- ( event.clientY / window.innerHeight ) * 2 + 1,
			0.5 );

		var allSelected = selectionBox.select();
		for ( var i = 0; i < allSelected.length; i ++ ) {
      if (Array.isArray(allSelected[ i ].material))
        continue
      allSelected[ i ].material = allSelected[ i ].material.clone()
			allSelected[ i ].material.color.set( 0xffffff );

		}

	}

} );

document.addEventListener( 'pointerup', function ( event ) {
  if (event.which != 3)
    return
	selectionBox.endPoint.set(
		( event.clientX / window.innerWidth ) * 2 - 1,
		- ( event.clientY / window.innerHeight ) * 2 + 1,
		0.5 );

	var allSelected = selectionBox.select();
	for ( var i = 0; i < allSelected.length; i ++ ) {
    if (Array.isArray(allSelected[ i ].material))
      continue
		allSelected[ i ].material.color.set( 0xffffff );

	}
  subgraphSelect(allSelected)

} );

function subgraphSelect(selected) {
  // console.log(selected.length)
  if (selected.length <= 1) {
    for (let i in subPlanes)
      scene.remove(subPlanes[i].plane)

    return
  }
  var data = {nodes: [], links: []}
  let ids = {}
  let xRange = [10, -10]
  let yRange = [10, -10]
  for (let id in selected) {
    if (selected[id].geometry.type == "SphereGeometry") {
      // console.log(`Name: ${selected[id].name}, Lat: ${selected[id].position.x}, Lon: ${selected[id].position.z}`)
      xRange[0] = Math.min(xRange[0], selected[id].position.x)
      xRange[1] = Math.max(xRange[1], selected[id].position.x)
      yRange[0] = Math.min(yRange[0], selected[id].position.z)
      yRange[1] = Math.max(yRange[1], selected[id].position.z)

      data.nodes.push({id: parseInt(id), city: selected[id].name, lat: parseFloat(selected[id].position.x), long: parseFloat(selected[id].position.z)})
      ids[selected[id].name] = parseInt(id)

    } else if (selected[id].geometry.type == "BufferGeometry") {
      // console.log(ids)
      let start = selected[id].name.split('/')[0]
      let end = selected[id].name.split('/')[1]
      let weight = selected[id].userData.weight
      // console.log(selected[id].name)
      // console.log(selected[id].name.split('/'))
      // console.log(start)
      // console.log(`Start: ${start}(${ids[start]}), End: ${end}(${ids[end]}), Weight: ${weight}`)
      if (ids[start] == undefined || ids[end] == undefined)
        continue
      data.links.push({source: ids[start], target: ids[end], ricciCurvature: weight})
    }
  }
  let mid = [(xRange[0]+xRange[1])/2, (yRange[0]+yRange[1])/2]
  let width = xRange[1] - xRange[0]
  let height = yRange[1] - yRange[0]
  // --- DRAW PLANE ---
  var mapCanvas = document.getElementById('map').getElementsByTagName('canvas')[0]
  const ctx = mapCanvas.getContext('2d')
  var subTexture = new T.CanvasTexture(ctx.canvas)
  subTexture.minFilter = THREE.LinearFilter
  subTexture.center = new T.Vector2(0.5, 0.5)
  subTexture.rotation = -Math.PI/2
  subTexture.repeat.y = (xRange[1] - xRange[0]) / 20
  subTexture.repeat.x = (yRange[1] - yRange[0]) / 20
  subTexture.offset.x = mid[1] / 20
  subTexture.offset.y = mid[0] / 20

  var subGeom = new T.PlaneGeometry(width, height, divisions-1, divisions-1)
  // var material = new T.MeshBasicMaterial( { color: graphcolor, side: T.DoubleSide} )
  var subMat = new THREE.MeshPhongMaterial( { color: graphcolor, clippingPlanes: [clipPlane2, clipPlane3, clipPlane4, clipPlane5], vertexColors: T.VertexColors, side: THREE.DoubleSide,  flatShading: false, shininess: 0, wireframe: false, map: subTexture} )
  var subPlane = new T.Mesh( subGeom, subMat )

  subPlane.position.set(mid[0], 0.001, mid[1])
  subPlane.rotation.set(-Math.PI/2, 0., 0.)
  let spObj = {}
  spObj.start = [Math.floor((xRange[0] + 10) * divisions / 20), Math.floor((yRange[0] + 10) * divisions / 20)]
  spObj.end = [Math.ceil((xRange[1] + 10) * divisions / 20), Math.ceil((yRange[1] + 10) * divisions / 20)]
  spObj.plane = subPlane
  scene.add( subPlane )
  subPlanes.push(spObj)
  let scale = Math.min(width, height) / divisions
  scale *= 3
  console.log(scale)
  // ---GENERATE SURFACE

  var xmlHttp = new XMLHttpRequest();
  xmlHttp.responseType = "text"

  xmlHttp.onreadystatechange = function() {
    if(xmlHttp.readyState == 4 && xmlHttp.status == 200) {
      dataSent = false
      data = JSON.parse(xmlHttp.responseText)
      let newHeightMap = Array(divisions).fill().map(() => Array(divisions).fill(0.0));
      for (let i = 0 ; i < divisions ; i++) {
        for (let j = 0 ; j < divisions ; j++) {
          newHeightMap[j][49-i] = data[i*divisions + j]*scale
        }
      }
      setPlaneHeights(subPlane, newHeightMap)
    }
  }
  xmlHttp.open("post", "calc-surface");
  xmlHttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

  xmlHttp.send(JSON.stringify(data));
  console.log("data sent")
  dataSent = true
}

function setPlaneHeights(plane, map) {
  for (let i=0; i<divisions ; i++) {
    for (let j=0; j < divisions ; j++) {
      if (i < 2) {
        plane.geometry.vertices[i*divisions+j].z =  map[3][j]
      } else if (i >= divisions-2) {
        plane.geometry.vertices[i*divisions+j].z =  map[divisions-3][j]
      } else {
        plane.geometry.vertices[i*divisions+j].z =  map[i][j]
      }
    }
  }
  plane.geometry.groupsNeedUpdate = true
  plane.geometry.verticesNeedUpdate = true
  plane.geometry.colorsNeedUpdate = true
  plane.geometry.computeVertexNormals()
}

function calcContours(xlimit, ylimit) {
  xlimit = 0
  ylimit = 0
  if (contourMeshLines.length != 0) {
    for (let line of contourMeshLines)
      scene.remove(line)
  }

  contcolor = 0x000000 // ffffff // 707070
  var lineMat = new T.LineBasicMaterial({color: contcolor, linewidth: 4, depthFunc: T.LessEqualDepth, transparent: true, opacity: 0.05, clippingPlanes: [clipPlane, clipPlane2]})
  var conrec = new Conrec
  let nLevels = 26
  let levels = []
  let min = -2.2
  let max = 1.6
  for (let i = min; i < max ; i+=(max-min)/nLevels) {
    levels.push(i)
  }

  // let levels = [-2.4, -2.2, -2, -1.8, -1.6, -1.4, -1.2, -1, -0.8, -0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8, 1, 1.2, 1.4]
  //-- CONTOUT LINES --//
  conrec.contour(heightMap, xlimit, heightMap.length - xlimit - 1, ylimit, heightMap[0].length - 1 - ylimit, contX, contY, levels.length, levels)

  let lines = conrec.contourList()

  for (let line of lines) {
    let points = []
    // console.log(line)
    // console.log(line)
    for (let pt of line) {
      pt.x = (pt.x*(planeW/149)) - (planeW/2)// (0, 149) to (planeXMin, planeXMax)
      pt.y = (pt.y*(planeH/149)) - (planeH/2)// (0, 149) to (planeYMin, planeYMax)
      // console.log(pt.x)
      let limits = 5
      // if (pt.x >= -5 && pt.x <= 5 && pt.y >= -7 && pt.y <= 7)
      //   points.push(new T.Vector3(pt.y, line.level+0.01, pt.x))
      // if (pt.x >= -5 && pt.x <= 5 && pt.y >= -7 && pt.y <= 7)
      //   points.push(new T.Vector3(pt.y, line.level+0.01, pt.x))
      if (pt.x >= -10 && pt.x <= 10 && pt.y >= -7 && pt.y <= 7)
        points.push(new T.Vector3(pt.y, line.level+0.01, pt.x))
    }

    let geom = new T.BufferGeometry().setFromPoints(points)
    let lineMesh = new T.Line(geom, lineMat)
    contourMeshLines.push(lineMesh)
    scene.add(lineMesh)
  }




    // if (lineMat != lineMatSec) {
    //   points.push(new T.Vector3(edge.start.mesh.position.x, vertexHeight+0.0001, edge.start.mesh.position.z))
    //   points.push(new T.Vector3(edge.end.mesh.position.x, vertexHeight+0.0001, edge.end.mesh.position.z))
    // } else {
    //   points.push(new T.Vector3(edge.start.mesh.position.x, vertexHeight, edge.start.mesh.position.z))
    //   points.push(new T.Vector3(edge.end.mesh.position.x, vertexHeight, edge.end.mesh.position.z))
    // }
    // points.push(new T.Vector3(edge.start.mesh.position.x, vertexHeight+0.0001, edge.start.mesh.position.z))
    //
    // let geom = new T.BufferGeometry().setFromPoints(points)
    //
    // let line = new T.Line(geom, lineMat)
    //
    //
    // scene.add( line );
    // linesDrawn.push(line)
}

function raiseHeightMap() {
  xLimit = 55
  yLimit = 35
  for (let i = 0 ; i < xLimit ; i++) {
    for (let j = 0 ; j < (heightMap[0].length-1)/2; j++) {
      heightMap[i][j] = 0
      heightMap[i][heightMap[0].length-1-j] = 0
      heightMap[heightMap.length-1-i][j] = 0
      heightMap[heightMap.length-1-i][heightMap[0].length-1-j] = 0
    }
  }
  for (let i = xLimit ; i < heightMap.length - xLimit ; i++) {
    for (let j = 0 ; j < yLimit; j++) {
      heightMap[i][j] = 0
      heightMap[i][heightMap[0].length-1-j] = 0
      heightMap[heightMap.length-1-i][j] = 0
      heightMap[heightMap.length-1-i][heightMap[0].length-1-j] = 0
    }
  }
  return 0
}

function smoothHeightMap() {
  for (let j = 0 ; j < heightMap[0].length ; j++) {
    heightMap[0][j] = heightMap[2][j]
    heightMap[1][j] = heightMap[2][j]
    heightMap[heightMap.length-2][j] = heightMap[heightMap.length-3][j]
    heightMap[heightMap.length-1][j] = heightMap[heightMap.length-2][j]


  }
  for (let i = 2 ; i < heightMap.length-2 ; i++) {
    for (let j = 2 ; j < heightMap[0].length-2; j++) {
      // if (heightMap[i][j] == 0) {
      //   if (heightMap[i+1][j] * heightMap[i-1][j] *
      //     heightMap[i][j+1] * heightMap[i][j-1] != 0 ) {// If all neighbours are non zero
      //     heightMap[i][j] = (heightMap[i+1][j] + heightMap[i-1][j] +
      //       heightMap[i][j+1] + heightMap[i][j-1]) / 4
      //
      //   } else {
      //     continue
      //   }
      // }
      let neighbours = [heightMap[i+1][j], heightMap[i-1][j],
        heightMap[i][j+1], heightMap[i][j-1], heightMap[i+1][j+1],
        heightMap[i+1][j-1], heightMap[i-1][j-1], heightMap[i-1][j+1],
        heightMap[i+2][j], heightMap[i-2][j],
        heightMap[i][j+2], heightMap[i][j-2], heightMap[i+2][j+2],
        heightMap[i+2][j-2], heightMap[i-2][j-2], heightMap[i-2][j+2]]

      // if (Math.min(neighbours) < 0 && Math.max(neighbours) > 0)
      //   continue

      let sum = neighbours.reduce((a, b) => a + b, 0)
      let count = neighbours.length
      sum = 0
      count = 0
      let useZero = true
      if (heightMap[i][j] < -0.1)
        useZero = false
      for(let i = 0 ; i < neighbours.length ; i++) {
        if (neighbours[i] == 0 && !useZero) { // If neighbour is 0 and don't use zero flag is set
          continue
        }
        sum += neighbours[i]
        count++
      }

      heightMap[i][j] += sum
      heightMap[i][j] /= count + 1
      // if (Math.abs(heightMap[i][j]) <= 0.0003) {
      //   heightMap[i][j] = 0
      // }

    }
  }
}

// TODO: Make the percent dropoff more quadratic
// TODO: Deal with clashing heights - Add heights of multiple edges together -> Deal with huge towers

function setHeights(start, mid, end, weight) {

  if (weight >= 0) {
    // --- Gaussian heights ---
    // TODO: Only iterate through local points for speedup instead of whole 2d array
    let x = mid.y
    let y = mid.x
    let amp = document.getElementById("amp-slider").value // Def 1000
    weight = 2.5*weight
    let spread = (divisions/10)*(0.4*weight)*document.getElementById("posrange-slider").value
    let xSpread =  spread // Use divisions variable instead of hard coding spread
    let ySpread = spread
    for (let i = 0 ; i < heightMap.length ; i++) {
      for (let j = 0 ; j < heightMap[0].length ; j++) {
        if ((i-x)**2 + (j-y)**2 > 250*(0.4*weight))
          continue
        let xTerm = Math.pow(i - x, 2) / (2.0*Math.pow(xSpread, 2))
        let yTerm = Math.pow(j - y, 2) / (2.0*Math.pow(ySpread, 2))
        let newHeight = weight*Math.pow(amp, -1.0*(xTerm + yTerm))*document.getElementById("posheight-slider").value
        // if (Math.abs(newHeight) <= 0.01) {
        //   newHeight = 0
        // }
        if (heightMap[i][j] * newHeight > 0) { // Both in same direction, then choose highest magnitude
          if (newHeight >= 0) {
            heightMap[i][j] = Math.max(heightMap[i][j], newHeight)
          } else {
            heightMap[i][j] = Math.min(heightMap[i][j], newHeight)
          }
        } else { // Else average
          if (Math.abs(heightMap[i][j]) < Math.abs(newHeight)) {
            heightMap[i][j] = newHeight
          }
        }
      }
    }
  } else {
    // TODO: Improve scaling [add 0.2?] -> -0.1 doesnt do much
    // TODO: Rotate
    // TODO: Rotate checking max heights
    // TODO: Point the ends of the saddle curve
    // TODO: Change ySpread and yLimit based on edge distance and heights
    // TODO: Left and right sides of curve have different yLimits to line up with heights
    // --- Saddle Heights ---
    let slope = (start.y - end.y) / (start.x - end.x)
    let angle = Math.atan(slope)
    let dist = calcDist(start, end)

    let xSpread = Math.max(20, dist*0.56)*parseFloat(document.getElementById("xspread-slider").value) // length // Def 26
    let ySpread = 10*1.5*2.5*parseFloat(document.getElementById("yspread-slider").value) // 2.5 // width TODO: Multiply with edge length
    let xLimit = ((1.25*weight*2)/(xSpread)) * parseFloat(document.getElementById("xlimit-slider").value) // Def 1000// height along length Def 0.05
    let yLimit = (0.1*0.7)  * parseFloat(document.getElementById("ylimit-slider").value) // 0.7 // 0.55 // depth along width TODO: Change based on edge length
    let addHeight = (-0.5 + weight) + parseFloat(document.getElementById("height-slider").value)
    // console.log(addHeight)
    // console.log(document.getElementById("height-slider").value)
    // addHeight += document.getElementById("height-slider").value
    // console.log(addHeight)

    for (let i = mid.x - xSpread ; i <= mid.x + xSpread ; i++) {
      for (let j = mid.y - ySpread; j <= mid.y + ySpread ; j++) {
        let newHeight = ((i-mid.x)*xLimit)**2 - ((j-mid.y)*yLimit)**2
        // newHeight *= -1
        newHeight += addHeight
        let x_pos = j
        let y_pos = i

        // X and Y coordinate calculations are switched
        x_pos = Math.round((i-mid.x)*Math.sin(angle) + (j-mid.y)*Math.cos(angle)) + mid.y
        y_pos = Math.round((i-mid.x)*Math.cos(angle) - (j-mid.y)*Math.sin(angle)) + mid.x
        if (x_pos >= heightMap.length || y_pos >= heightMap.length || x_pos < 0 || y_pos < 0)
          continue
        // Check closest to which pt
        if (newHeight > heightMap[x_pos][y_pos]) {
          if (heightMap[x_pos][y_pos] != 0)
            continue
          newHeight = 0.1
        }

        if (newHeight < heightMap[x_pos][y_pos] && heightMap[x_pos][y_pos] > 0.1) {
          continue
        }



        if (heightMap[x_pos][y_pos] * newHeight >= 0) { // Both in same direction, then choose highest magnitude
          if (newHeight >= 0) {
            heightMap[x_pos][y_pos] = Math.max(heightMap[x_pos][y_pos], newHeight)
          } else {
            heightMap[x_pos][y_pos] = Math.min(heightMap[x_pos][y_pos], newHeight)
          }
        } else { // Else highest magnitude
          if (Math.abs(heightMap[x_pos][y_pos]) < Math.abs(newHeight)) {
            heightMap[x_pos][y_pos] = newHeight
          }
        }

        // distStart = calcDist(start, {x: i, y: j})
        // distEnd = calcDist(end, {x: i, y: j})
        // if (distStart < distEnd) {
        //   if (newHeight > heightMap[start.y][start.x])
        //     console.log("true1")
        //   heightMap[i][j] = Math.min(newHeight, heightMap[start.y][start.x])
        // } else {
        //   if (newHeight > heightMap[end.y][end.x])
        //     console.log("true2")
        //   heightMap[i][j] = Math.min(newHeight, heightMap[end.y][end.x])
        //
        // }
      }
    }

    // heightMap[start.y][start.x] = 10
    // heightMap[end.y][end.x] = 20

  }

  // heightMap[x][y] = weight

  /* --- Sine heights ---
  levels = (divisions/10) * Math.abs(weight)  // Make levels dependant on height (* weight)
  percent = 1/levels
  for (let i = 0, j = levels+2 ; j >= 0 ; i += 2/levels, j--) {
    for (let angle = 0 ; angle < 360 ; angle++) {
      new_x = Math.round(x + (j)*Math.cos(angle))
      new_y = Math.round(y + (j)*Math.sin(angle))
      percent = ((0.5 * Math.sin(1.4*(i - 1.1))) + 0.5)
      if (percent <= 0 && i > 1)
        percent = 1;
      new_val = weight * percent  // 3rd level -> 25%, 2nd level -> 50% ... etc
      if (new_x < divisions && new_y < divisions && new_x >= 0 && new_y >= 0) {
        if (new_val * heightMap[new_x][new_y] < 0) // They have opposite sign
          heightMap[new_x][new_y] = (heightMap[new_x][new_y] + new_val) / 2 // Take average
        else if (Math.abs(new_val) > 0 && Math.abs(new_val) > Math.abs(heightMap[new_x][new_y])) // Else one is bigger than the other
          heightMap[new_x][new_y] = new_val
      }
    }

  }
  */

  /* --- Radial heights ---
  for (levels -= 0 ; levels >= 0 ; levels--) {
    for (let angle = 0 ; angle < 360 ; angle++) {
      new_x = Math.round(x + (levels+1)*Math.cos(angle))
      new_y = Math.round(y + (levels+1)*Math.sin(angle))
      new_val = weight * (1 - levels * percent)  // 3rd level -> 25%, 2nd level -> 50% ... etc
      if (new_x < divisions && new_y < divisions && new_x >= 0 && new_y >= 0)
        if (new_val * heightMap[new_x][new_y] < 0) // They have opposite sign
          heightMap[new_x][new_y] = (heightMap[new_x][new_y] + new_val) / 2 // Take average
        if (Math.abs(new_val) > 0 && Math.abs(new_val) > Math.abs(heightMap[new_x][new_y])) // Else one is bigger than the other
          heightMap[new_x][new_y] = new_val
    }
  }
  */


}

function calcDist(pt1, pt2) {
  return Math.sqrt((pt1.x - pt2.x)**2 + (pt1.y - pt2.y)**2)
}

function vertexNameChange() {
  // TODO: Deal with duplicate names
  if (this.value == '')
    return
  let parentDiv = this.parentElement
  let id = parentDiv.childNodes[0].textContent
  let pt = vertices[id]
  let oldName = pt.name
  pt.name = this.value
  scene.remove(pt.label)
  pt.label = getNameSprite(this.value)
  pt.label.position.set(pt.mesh.position.x, vertexHeight + 0.5, pt.mesh.position.z)
  scene.add(pt.label)
  delete names[oldName]
  names[pt.name] = parseInt(id)

}

function vertexPositionChange() {
  if (this.value == '' || isNaN(this.value))
    return
  // console.log("Postion Change")
  let parentDiv = this.parentElement
  let id = parentDiv.childNodes[0].textContent
  let pt = vertices[id]
  if (this.className == "xPos") {
    pt.mesh.position.x = this.value
    pt.label.position.x = this.value
    pt.lat = this.value*(90/7)

  } else {
    pt.mesh.position.z = this.value
    pt.label.position.z = this.value
    pt.long = this.value*(180/10)

  }

}

function addVertex(obj, x, y, drawPoint, name, lat=0, long=0) {
  if (typeof drawPoint == 'undefined')
    drawPoint = true

  if (lat == 0 && long == 0) {
    lat = x
    long = y
  }
  if (typeof x == 'undefined') {
    x = getRandomArbitrary(-6, 6).toFixed(2)
  }
  if (typeof y == 'undefined') {
    y = getRandomArbitrary(-9, 9).toFixed(2)
  }

  let vDiv = document.createElement("div")
  vDiv.id = "vertex" + vertexCount
  vDiv.className = "form-box"

  let idLbl = document.createElement("label")
  idLbl.setAttribute("for", "id")
  idLbl.textContent = vertexCount

  if (typeof name == 'undefined')
    name = vertexCount

  let nameLbl = document.createElement("label")
  nameLbl.setAttribute("for", "name")
  nameLbl.textContent = "Name:"

  let nameInput = document.createElement("input")
  nameInput.className = "name"
  nameInput.setAttribute("type", "text")
  nameInput.defaultValue = name
  nameInput.onchange = vertexNameChange

  let xPosLbl = document.createElement("label")
  xPosLbl.setAttribute("for", "xPos")
  xPosLbl.textContent = "x:"

  let xPos = document.createElement("input")
  xPos.className = "xPos"
  xPos.setAttribute("type", "text")
  xPos.defaultValue = x
  xPos.oninput = vertexPositionChange

  let yPosLbl = document.createElement("label")
  yPosLbl.setAttribute("for", "yPos")
  yPosLbl.textContent = "y:"


  let yPos = document.createElement("input")
  yPos.className = "yPos"
  yPos.setAttribute("type", "text")
  yPos.defaultValue = y
  yPos.oninput = vertexPositionChange

  let del = document.createElement("button")
  del.className = "btn-delete"
  del.innerHTML = "X";
  del.onclick = removeVertex

  vDiv.appendChild(idLbl)
  vDiv.appendChild(nameLbl)
  vDiv.appendChild(nameInput)
  vDiv.appendChild(xPosLbl)
  vDiv.appendChild(xPos)
  vDiv.appendChild(yPosLbl)
  vDiv.appendChild(yPos)
  vDiv.appendChild(del)
  document.getElementById("div-vertex").appendChild(vDiv)

  xPos.select()


  let newPt = new T.Mesh(ptGeom, ptMat)
  newPt.position.y = vertexHeight
  newPt.position.x = xPos.value
  newPt.position.z = yPos.value
  newPt.name = name

  let sprite = getNameSprite(name)
  sprite.position.set(xPos.value, vertexHeight + 0.5 + Math.random()*0.2, yPos.value)

  if (drawPoint) {
    scene.add(sprite)
    scene.add(newPt)
  }
  vertices[String(vertexCount)] = new VertexObj(vertexCount, name, newPt, sprite, lat, long)
  names[name] = vertexCount
  vertexCount++
}

function addVertexSec(obj, x, y, vertices, drawPoint=false) {
  let newPt = new T.Mesh(ptGeom, ptMat)
  newPt.position.y = vertexHeight
  newPt.position.x = x
  newPt.position.z = y

  length = Object.keys(vertices).length

  let sprite = getNameSprite(length)
  sprite.position.set(x, vertexHeight + 0.5, y)

  if (drawPoint) {
    scene.add(sprite)
    scene.add(newPt)
    // console.log(length)
  }

  vertices[String(length)] = new VertexObj(length, length, newPt, sprite)
}

function removeVertex() {
  let parentDiv = this.parentElement
  let name = parentDiv.childNodes[0].textContent
  scene.remove(vertices[name].mesh)
  scene.remove(vertices[name].label)
  delete vertices[name]
  parentDiv.remove()
}

function generateGraph() {
  // Graph 1 & 2
  {
    // Graph 1
    addVertex(null, -5, 0)
    addVertex(null, -4, -1.73)
    addVertex(null, -3, -0.5)
    addVertex(null, 3, -0.5)
    addVertex(null, 4, 1.73)
    addVertex(null, 5, 0)

    addEdge(null, 2, 3, -.5)
    addEdge(null, 0, 1, .8)
    addEdge(null, 0, 2, .7)
    addEdge(null, 1, 2, .9)
    addEdge(null, 3, 4, .6)
    addEdge(null, 3, 5, .5)
    addEdge(null, 4, 5, .4)

    // Graph 2
    // 0-A - -5, 0
    // 1-B - -4.5, -1
    // 2-C - -3.5, 0.5
    // 3-E - -3, 0 // Skip D
    // 4-F - -1.5, 0
    // 5-G - 2.4, 0.5
    // 6-H - 2.4, -0.5
    // 7-I - 3.5, 0.8
    // 8-J - 4, 3
    var vertices2 = {}
    var edges2 = {}
    addVertexSec(null, -5.5, -0.5, vertices2) // A
    addVertexSec(null, -4.7, -1.2, vertices2) //B
    addVertexSec(null, -4.3, 0, vertices2) //C
    addVertexSec(null, -4, -0.5, vertices2) //E
    addVertexSec(null, -2.5, -0.5, vertices2) //F
    addVertexSec(null, 3.4, 1, vertices2) //G
    addVertexSec(null, 3.4, 0, vertices2) //H
    addVertexSec(null, 4.5, 1.1, vertices2) //I
    addVertexSec(null, 5.7, 2.7, vertices2) //J
    //
    //

    addEdgeSec(null, 4, 6, -.5, vertices2, edges2)

    addEdgeSec(null, 0, 1, .8, vertices2, edges2) // A - B
    addEdgeSec(null, 0, 2, .7, vertices2, edges2) // A - C
    addEdgeSec(null, 0, 3, .7, vertices2, edges2) // A - E
    addEdgeSec(null, 1, 4, .8, vertices2, edges2) // B - F
    addEdgeSec(null, 1, 3, .8, vertices2, edges2) // B - E
    addEdgeSec(null, 2, 3, .8, vertices2, edges2) // C - E
    addEdgeSec(null, 2, 4, .7, vertices2, edges2) // C - F
    addEdgeSec(null, 3, 4, .7, vertices2, edges2) // E - F

    addEdgeSec(null, 6, 5, .7, vertices2, edges2) // H - G
    addEdgeSec(null, 6, 7, .7, vertices2, edges2) // H - I
    addEdgeSec(null, 5, 7, .8, vertices2, edges2) // G - I
    addEdgeSec(null, 5, 8, .7, vertices2, edges2) // G - J
    addEdgeSec(null, 7, 8, .7, vertices2, edges2) // I - J
  }
}

function generateGraphNoWeights() {
  // Graph 1 & 2
  {
    // Graph 1
    addVertex(null, -5, 0)
    addVertex(null, -4, -1.73)
    addVertex(null, -3, -0.5)
    addVertex(null, 3, -0.5)
    addVertex(null, 4, 1.73)
    addVertex(null, 5, 0)

    addEdge(null, 2, 3, 0)
    addEdge(null, 0, 1, 0)
    addEdge(null, 0, 2, 0)
    addEdge(null, 1, 2, 0)
    addEdge(null, 3, 4, 0)
    addEdge(null, 3, 5, 0)
    addEdge(null, 4, 5, 0)

    // Graph 2
    // 0-A - -5, 0
    // 1-B - -4.5, -1
    // 2-C - -3.5, 0.5
    // 3-E - -3, 0 // Skip D
    // 4-F - -1.5, 0
    // 5-G - 2.4, 0.5
    // 6-H - 2.4, -0.5
    // 7-I - 3.5, 0.8
    // 8-J - 4, 3
  }
}

function drawEdge(edge, lineMat) {
  // console.log(edge.end.mesh.position.x + " " + edge.end.mesh.position.z)
  let points = []
  if (lineMat != lineMatSec) {
    points.push(new T.Vector3(edge.start.mesh.position.x, vertexHeight+0.0001, edge.start.mesh.position.z))
    points.push(new T.Vector3(edge.end.mesh.position.x, vertexHeight+0.0001, edge.end.mesh.position.z))
  } else {
    points.push(new T.Vector3(edge.start.mesh.position.x, vertexHeight, edge.start.mesh.position.z))
    points.push(new T.Vector3(edge.end.mesh.position.x, vertexHeight, edge.end.mesh.position.z))
  }
  points.push(new T.Vector3(edge.start.mesh.position.x, vertexHeight+0.0001, edge.start.mesh.position.z))

  let geom = new T.BufferGeometry().setFromPoints(points)

  // New Line //
  // geom = new LineGeometry()
  // geom.setPositions(points)
  //
  // var colors = []
  // var color = new THREE.Color();
  // color.setHSL( 1, 1.0, 0.5 );
  // colors.push( color.r, color.g, color.b );
  //
  // geom.setColors( colors );
  //
  // matLine = new LineMaterial( {
  //
	// 				color: 0xff0000,
	// 				linewidth: 5, // in pixels
	// 				vertexColors: false,
	// 				//resolution:  // to be set by renderer, eventually
	// 				dashed: false
  //
	// 			} );
  //
  // let line = new Line2(geom, matLine)
  // 0x2cc57c
  let mat = new T.LineBasicMaterial({color: contcolor, linewidth: 4, depthFunc: T.LessEqualDepth, transparent: true, opacity: 0.05, clippingPlanes: [clipPlane, clipPlane2]})
  mat = new T.LineBasicMaterial({color: edgecolor, linewidth: 4, clippingPlanes: [clipPlane, clipPlane2, clipPlane3, clipPlane4, clipPlane5, ] })
  let line = new T.Line(geom, mat)
  let color = new T.Color()
  if (edge.weight >= 0)
    var endColor = new T.Color("hsl(145, 98%, 40%)")
  else
    var endColor = new T.Color("hsl(0, 76%, 43%)")
  color.lerpHSL(endColor, Math.abs(edge.weight))
  line.material.color.set(color)
  line.name = edge.start.name + "/" + edge.end.name
  line.userData = {weight: edge.weight}

  scene.add( line );
  linesDrawn.push(line)
}

function addEdge(obj, start, end, weight) {
  if (typeof start == 'undefined') {
    start = 0
  }

  if (typeof end == 'undefined') {
    end = 0
  }

  if (typeof weight == 'undefined') {
    weight = 0
  }

  let vDiv = document.createElement("div")
  vDiv.id = "edge" + edgeCount
  vDiv.className = "form-box"

  let nameLbl = document.createElement("label")
  nameLbl.setAttribute("for", "name")
  nameLbl.textContent = edgeCount

  let startLbl = document.createElement("label")
  startLbl.setAttribute("for", "start")
  startLbl.textContent = "start:"

  let startText = document.createElement("input")
  startText.className = "start"
  startText.setAttribute("type", "text")
  startText.defaultValue = start
  startText.oninput = edgeChange

  let endLbl = document.createElement("label")
  endLbl.setAttribute("for", "start")
  endLbl.textContent = "end:"

  let endText = document.createElement("input")
  endText.className = "end"
  endText.setAttribute("type", "text")
  endText.defaultValue = end
  endText.oninput = edgeChange

  let weightLbl = document.createElement("label")
  weightLbl.setAttribute("for", "weight")
  weightLbl.textContent = "weight:"

  let weightText = document.createElement("input")
  weightText.className = "weight"
  weightText.setAttribute("type", "text")
  weightText.defaultValue = weight
  weightText.oninput = edgeChange

  let del = document.createElement("button")
  del.className = "btn-delete"
  del.innerHTML = "X";
  del.onclick = removeEdge



  vDiv.appendChild(nameLbl)
  vDiv.appendChild(startLbl)
  vDiv.appendChild(startText)
  vDiv.appendChild(endLbl)
  vDiv.appendChild(endText)
  vDiv.appendChild(weightLbl)
  vDiv.appendChild(weightText)
  vDiv.appendChild(del)
  document.getElementById("div-edge").appendChild(vDiv)


  let size = Object.keys(vertices).length

  let s = parseInt(startText.value)
  let e = parseInt(endText.value)
  // console.log("s: " + s + " e: " + e)

  weight = parseFloat(weightText.value)

  let startPt = vertices[s]
  let endPt = vertices[e]
  if (startPt == endPt) {
    // TODO: Deal with this
  }

  let edge = new EdgeObj(edgeCount, startPt, endPt, weight)
  edges[edgeCount] = edge
  edgeCount++
}

function addEdgeSec(obj, start, end, weight, vertices, edges) {
  let vSize = Object.keys(vertices).length
  let eSize = Object.keys(edges).length

  let s = parseInt(start)
  let e = parseInt(end)
  // console.log("s: " + s + " e: " + e)

  weight = parseFloat(weight)

  let startPt = vertices[s]
  let endPt = vertices[e]
  if (startPt == endPt) {
    // TODO: Deal with this
  }

  let edge = new EdgeObj(eSize, startPt, endPt, weight)
  edges[eSize] = edge
}

function edgeChange() {
  // TODO: Deal with non existent vertices
  if (this.value == '' || isNaN(this.value))
    return
  let parentDiv = this.parentElement
  let startId = parentDiv.childNodes[2].value
  let endId = parentDiv.childNodes[4].value
  let weight = parseFloat(parentDiv.childNodes[6].value)
  let id = parentDiv.childNodes[0].textContent
  // console.log(startId + " " + endId + " " + weight)
  let edge = edges[id]
  edge.start = vertices[startId]
  edge.end = vertices[endId]
  edge.weight = weight
}

function removeEdge() {
  //TODO: Remove edge
  console.log("Remove edge")
  let parentDiv = this.parentElement
  let id = parentDiv.childNodes[0].textContent
  delete edges[id]
  parentDiv.remove()
}

function getNameSprite(name) {
  // if (name < 3)
  //   name = String.fromCharCode(65 + name)
  // else
  //   name = String.fromCharCode(65 + name + 1)

  let canvas = document.createElement('canvas')
  let ctx = canvas.getContext('2d')


  // ctx.fillStyle = "#ffff00";
  // ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  let metrics = ctx.measureText( name );
  let textWidth = metrics.width;
  let textHeight = metrics.height
  // console.log(metrics.width)

  ctx.canvas.width = textWidth*30+30;
  ctx.canvas.height = textWidth*30+10;

  ctx.font="120px Roboto Mono"
  ctx.fillStyle = "#000000"






  ctx.fillText(name, ctx.canvas.width/2 - textWidth/2, ctx.canvas.height/2)

  let texture = new T.CanvasTexture(ctx.canvas)
  texture.needsUpdate = true

  let spriteMat = new T.SpriteMaterial({map: texture, })
  let sprite = new T.Sprite(spriteMat)
  sprite.scale.set(0.05*textWidth, 0.05*textWidth, 0.05*textWidth)
  return sprite
}

let VertexObj = class {
  start = [] // Edges starting at this vertex
  end = [] // Edges ending at this vertex

  constructor(id, name, mesh, label, lat=0, long=0, start=[], end=[]) {
    this.id = id
    this.name = name
    this.mesh = mesh
    this.label = label
    this.start = start
    this.end = end
    this.lat = lat
    this.long = long
  }
}

let EdgeObj = class {
  constructor(id, start, end, weight) {
    this.id = id
    this.start = start
    this.end = end
    this.weight = weight
    this.bearing = GreatCircle.bearing(start.lat, start.long, end.lat, end.long)
    this.split = false
    // console.log(`${start.long}, ${end.long}, ${this.bearing}`)
    if (start.long > end.long && this.bearing <= 180)
      this.split = true
  }
}

function createMap() {
  var mapdiv = document.createElement('div')
  mapdiv.id = 'map'
  mapdiv.class = 'map-div'
  // mapdiv.style.width = '400px'
  // mapdiv.style.height = '400px'
  document.body.appendChild(mapdiv)
  var map = new ol.Map({
        target: 'map',
        renderer:'canvas',
        layers: [
          // new ol.layer.Tile({
          //   source: new ol.source.OSM(),
          //   // resolution: 152.87405654296876,
          //   // tileSize: [1024,1024]
          // }),
          new ol.layer.Tile({
            source: new ol.source.Stamen({
              layer: 'terrain'
            })
          })
        ],
        view: new ol.View({
          // center: ol.proj.fromLonLat([67.41, 8.82]),
          // projection: 'EPSG:9823',
          center: ol.proj.fromLonLat([0, 0]),
          zoom: 0,
        })
  });
  return map
}

function calculateCurvature() {
  console.log("calculate curvature")
  var data = {nodes: [], links: []}
  for (let id in vertices) {
    data.nodes.push({id: id})
  }
  let current_edges = {...edges}
  if (edgeCollection.length > 0)
    current_edges = {...edgeCollection[document.getElementById("threshold-slider").value]}
  console.log(current_edges)
  for (let id in current_edges) {
    let edge = current_edges[id]
    data.links.push({source: edge.start.id, target: edge.end.id})
  }
  // $.ajax({
  // type: "POST",
  // url: "./scripts/OllivierRicci.py",
  // data: { param: text}
  //   }).done(function( o ) {
  //      // do something
  //   })
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.onreadystatechange = function()
  {
      if(xmlHttp.readyState == 4 && xmlHttp.status == 200)
      {
          data = JSON.parse(xmlHttp.responseText)
          // console.log(data)
          console.log("data recv")
          let current_edges = {...edges}
          if (edgeCollection.length > 0)
            current_edges = {...edgeCollection[document.getElementById("threshold-slider").value]}
          for(let id in data.links) {
            let link = data.links[id]
            for (let id2 in current_edges) {
              let edge = current_edges[id2]
              if ((edge.start.id == link.source && edge.end.id == link.target) || (edge.start.id == link.target && edge.end.id == link.source)) {
                edge.weight = parseFloat(link.ricciCurvature)
                let edgeDiv = document.getElementById("edge" + id2)
                if (edgeDiv != null)
                  edgeDiv.querySelector(".weight").value = parseFloat(link.ricciCurvature)
                break
              }
            }
          }
      }
  }
  xmlHttp.open("post", "calc-curvature");
  xmlHttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

  xmlHttp.send(JSON.stringify(data));
  console.log("data sent")
}

function calcSurface() {
  console.log("calculate surface")
  var data = {nodes: [], links: []}
  let current_edges = {...edges}
  if (edgeCollection.length > 0)
    current_edges = {...edgeCollection[document.getElementById("threshold-slider").value]}
  length = Object.keys(vertices).length
  for (let id in vertices) {
    let node = vertices[id]
    data.nodes.push({id: parseInt(id), city: node.name, lat: node.lat, long: node.long})
  }
  data.nodes.push({id: length, city: "border1", lat: 0.001, long: 180.001})
  data.nodes.push({id: length+2, city: "border2", lat: 0.001, long: -180.001})
  data.nodes.push({id: length+3, city: "border3", lat: 155.001, long: 0.001}) // 138.5
  data.nodes.push({id: length+4, city: "border4", lat: -155.001, long: 0.001})

  for (let id in current_edges) {
    let edge = current_edges[id]
    data.links.push({source: edge.start.id, target: edge.end.id, ricciCurvature: edge.weight})
  }
  // console.log(vertices)
  // $.ajax({
  // type: "POST",
  // url: "./scripts/OllivierRicci.py",
  // data: { param: text}
  //   }).done(function( o ) {
  //      // do something
  //   })
  var xmlHttp = new XMLHttpRequest();
  // xmlHttp.responseType = "arraybuffer"
  xmlHttp.responseType = "text"

  xmlHttp.onreadystatechange = function()
  {
      if(xmlHttp.readyState == 4 && xmlHttp.status == 200)

      {
          // document.getElementById("heatmap-img").setAttribute('src', 'data:image/png;base64,' + btoa(String.fromCharCode.apply(null, new Uint8Array(xmlHttp.response))))
          dataSent = false
          // data = JSON.parse(xmlHttp.responseText)
          data = xmlHttp.responseText
          data = data.substring(data.indexOf('['))
          data = JSON.parse(data)
          console.log(data)
          console.log("data recv")
          for (let i = 0 ; i < divisions ; i++) {
            for (let j = 0 ; j < divisions ; j++) {
              calcHeightMap[j][49-i] = data[i*divisions + j]*2
              if (data[i*divisions + j] < -0.1) {
                // console.log(data[i*divisions + j])
                calcHeightMap[j][49-i] = data[i*divisions + j]*10
              }
            }
          }
          // console.log(calcHeightMap)


      }
  }
  xmlHttp.open("post", "calc-surface");
  xmlHttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

  xmlHttp.send(JSON.stringify(data));
  console.log("data sent")
  dataSent = true
}

function fileSelectEdges(evt) {
    evt.stopPropagation()
    evt.preventDefault()

    var files = evt.dataTransfer.files; // FileList object.
    console.log(files)
    for (let file of files) {
      readEdgeFile(file)
    }
}

function readEdgeFile(file) {
  var reader = new FileReader()
  reader.onload = function() {
    let current_edges = {}

    let text = reader.result
    let lines = text.split('\n')
    let i = -1
    let inputNames = []
    // console.log(lines)
    let inputNameData = lines[18].split('\"')
    let k = -1
    for (let nameData of inputNameData) {
      k++
      nameData = nameData.trim()
      if (nameData == '')
        continue
      if (k%2 == 1)
        inputNames.push(nameData)
      else {
        inputNames = inputNames.concat(nameData.split(' '))
      }
    }
    // console.log(lines)
    for (let i = 19 ; i < lines.length ; i++) {
      let line = lines[i]
      let data = line.split("\"")
      let currentNode = ''
      if (data.length > 1) { // Two word name - deal with double quotes
        currentNode = data[1]
        data = data[2].split(" ")
      } else {
        data = data[0].split(" ")
        currentNode = data[0]
        data = data.splice(1)
      }
      if (data[0] == '' || isNaN(data[0]))
        continue
      let currentId = names[currentNode]
      for (let j=0 ; j<i-19 ; j++) {
        let weight = parseFloat(data[j])
        if (weight == 0)
          continue
        let endNode = inputNames[j]
        let endId = names[endNode]
        console.log(`${weight} edge from ${currentNode}(${currentId}) to ${endNode}(${endId})`)
        addEdgeSec(null, currentId, endId, weight, vertices, current_edges)
      }
      // addVertex(null, (parseFloat(data[1])/90)*7, (parseFloat(data[2])/180)*10, true, data[0])
    }
    edgeCollection.push(current_edges)
    document.getElementById("threshold-slider").max = edgeCollection.length-1
  }
  reader.readAsText(file)

}

function fileSelectNodes(evt) {
    evt.stopPropagation()
    evt.preventDefault()

    var files = evt.dataTransfer.files; // FileList object.

    // files is a FileList of File objects. List some properties.
    // var output = [];
    // for (var i = 0, f; f = files[i]; i++) {
    //   output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
    //               f.size, ' bytes, last modified: ',
    //               f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a',
    //               '</li>');
    // }
    // document.getElementById('node-list').innerHTML = '<ul>' + output.join('') + '</ul>';

    var reader = new FileReader()

    reader.onload = function() {
      let text = reader.result
      let lines = text.split('\n')
      for (let line of lines) {
        let data = line.split(',')
        if (data[1] == '' || isNaN(data[1]))
          continue
        addVertex(null, (parseFloat(data[1])/155)*10, (parseFloat(data[2])/180)*10, true, data[0], parseFloat(data[1]), parseFloat(data[2]))
        // addVertex(null, (parseFloat(data[1])/180)*10, (parseFloat(data[2])/180)*10, true, data[0], parseFloat(data[1]), parseFloat(data[2]))
      }
    }
    reader.readAsText(files[0])

}

function dragOver(evt) {
  evt.stopPropagation()
  evt.preventDefault()
  evt.dataTransfer.dropEffect = 'copy' // Explicitly show this is a copy.
}

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive
}

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}
