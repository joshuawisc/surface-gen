let bgcolor = 0xf3f3f3
let graphcolor = 0xebe6e6
let vertexcolor = 0xff2e63
let edgecolor = 0x512b58

// let bgcolor = 0x512b58
// let graphcolor = 0x2c003e
// let vertexcolor = 0xfe346e
// let edgecolor = 0xd2fafb

// let bgcolor = 0xffc2c2
// let graphcolor = 0xff9d9d
// let vertexcolor = 0xff2e63
// let edgecolor = 0x010a43


let T = THREE

let vertexCount = 0
let edgeCount = 0

let planeW = 5
let planeH = 5


var scene = new T.Scene()
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 )

var renderer = new THREE.WebGLRenderer()
renderer.setSize( window.innerWidth, window.innerHeight )
// renderer.setClearColor()
document.body.appendChild( renderer.domElement )

scene.background = new THREE.Color(bgcolor)
var controls = new T.OrbitControls( camera, renderer.domElement );


var geometry = new T.PlaneGeometry(planeW*2, planeH*2, 50, 50)
var material = new T.MeshBasicMaterial( { color: graphcolor, side: T.DoubleSide } )
var plane = new T.Mesh( geometry, material )
plane.rotation.set(-1.57, 0, 0.)
scene.add( plane )

camera.position.z = 15
camera.position.y = 5
controls.update();


let vertices = {}
let ptGeom = new T.SphereGeometry(0.15, 32, 32)
let ptMat = new T.MeshBasicMaterial({color: vertexcolor})

var lineMat = new T.LineBasicMaterial({color: edgecolor, linewidth: 3.5})





window.onload = function() {

  let btnAddVertex = document.getElementById("btn-add-vertex")
  btnAddVertex.onclick = addVertex

  let btnAddEdge  = document.getElementById("btn-add-edge")
  btnAddEdge.onclick = addEdge

  var animate = function () {
  	requestAnimationFrame( animate )

    controls.update()

  	renderer.render( scene, camera )
  };

  animate();
}

function vertexNameChange() {
  //TODO: Name change
}

function vertexPositionChange() {
  if (this.value == '' || isNaN(this.value))
    return
  console.log("Postion Change")
  parentDiv = this.parentElement
  name = parentDiv.childNodes[1].defaultValue
  pt = vertices[name]
  if (this.className == "xPos")
    pt.mesh.position.x = this.value
  else
    pt.mesh.position.z = this.value
}

function addVertex() {
  let vDiv = document.createElement("div")
  vDiv.id = "vertex" + vertexCount
  vDiv.className = "form-box"

  let nameLbl = document.createElement("label")
  nameLbl.setAttribute("for", "name")
  nameLbl.textContent = "name:"

  let name = document.createElement("input")
  name.className = "name"
  name.setAttribute("type", "text")
  name.defaultValue = vertexCount
  name.onchange = vertexNameChange

  let xPosLbl = document.createElement("label")
  xPosLbl.setAttribute("for", "xPos")
  xPosLbl.textContent = "x:"

  let xPos = document.createElement("input")
  xPos.className = "xPos"
  xPos.setAttribute("type", "text")
  xPos.defaultValue = getRandomArbitrary(-planeH+1, planeH-1).toFixed(2)
  xPos.oninput = vertexPositionChange

  let yPosLbl = document.createElement("label")
  yPosLbl.setAttribute("for", "yPos")
  yPosLbl.textContent = "y:"


  let yPos = document.createElement("input")
  yPos.className = "yPos"
  yPos.setAttribute("type", "text")
  yPos.defaultValue = getRandomArbitrary(-planeH+1, planeH-1).toFixed(2)
  yPos.oninput = vertexPositionChange

  vDiv.appendChild(nameLbl)
  vDiv.appendChild(name)
  vDiv.appendChild(xPosLbl)
  vDiv.appendChild(xPos)
  vDiv.appendChild(yPosLbl)
  vDiv.appendChild(yPos)
  document.getElementById("div-vertex").appendChild(vDiv)

  name.select()


  let newPt = new T.Mesh(ptGeom, ptMat)
  newPt.position.y = 2
  newPt.position.x = xPos.value
  newPt.position.z = yPos.value
  scene.add(newPt)
  vertices[String(vertexCount)] = new VertexObj(vertexCount, vertexCount, newPt)

  vertexCount++
}


//TODO: Store lines and weights data struct
//TODO: Struct for drawn lines
//TODO: Redraw lines in each animate
//TODO: delete all previous lines

function addEdge() {
  size = Object.keys(vertices).length
  console.log("size: " + size)

  s = parseInt(Math.random()*(size))
  e = parseInt(Math.random()*(size))
  console.log("s: " + s + " e: " + e)

  startPt = vertices[s]
  endPt = vertices[e]
  if (startPt == endPt) {
    // TODO: Deal with this
  }
  console.log(startPt)
  console.log(endPt)
  points = []
  points.push(new T.Vector3(startPt.mesh.position.x, 2, startPt.mesh.position.z))
  // points.push(new T.Vector3(startPt.mesh.x + endPt.mesh.x, 2, startPt.mesh.z + endPt.mesh.z))
  points.push(new T.Vector3(endPt.mesh.position.x, 2, endPt.mesh.position.z))
  console.log(points)

  let geom = new T.BufferGeometry().setFromPoints(points)
  let line = new T.Line(geom, lineMat)


  line = new THREE.Line( geom, lineMat );
  scene.add( line );

  scene.add(line)
}

let VertexObj = class {
  start = [] // Edges starting at this vertex
  end = [] // Edges ending at this vertex

  constructor(id, name, mesh, start, end) {
    this.id = id
    this.name = name
    this.mesh = mesh
    this.start = start
    this.end = end
  }
}

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive
}

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}
