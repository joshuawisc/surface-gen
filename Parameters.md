# Parameters

The shape is created by setting the positive shapes first and then setting the negative shapes, since the negative shapes are more important and therefore overwrite the existing positive shape.

## Saddle (negative curvature)

### Saddle x range
The range / spread of the saddle shape from peak to peak. Controls how many cells in the grid are affected by this shape along one axis.
![](./images/parameters/sxrange/sxrange-1.png)
![](./images/parameters/sxrange/sxrange0.png)
![](./images/parameters/sxrange/sxrange1.png)

### Saddle y range
The range / spread of the saddle shape from valley to valley. Controls how many cells in the grid are affected by this shape along the other axis.
![](./images/parameters/syrange/syrange-1.png)
![](./images/parameters/syrange/syrange0.png)
![](./images/parameters/syrange/syrange1.png)


### Saddle steepness
Defines the height and width of the hills at both ends of the saddle i.e the steepness from hill to hill.
![](./images/parameters/ssteep/ssteep-1.png)
![](./images/parameters/ssteep/ssteep0.png)
![](./images/parameters/ssteep/ssteep1.png)


### Saddle narrowness
Defines the how narrow the saddle becomes at the middle, i.e. the steepness from valley to valley.
![](./images/parameters/snarrow/snarrow-1.png)
![](./images/parameters/snarrow/snarrow0.png)
![](./images/parameters/snarrow/snarrow1.png)


### Saddle rotation
Rotates the entire saddle shape.
![](./images/parameters/srot/srot0.png)
![](./images/parameters/srot/srot1.png)
![](./images/parameters/srot/srot-1.png)


### Saddle height
Heightens the entire saddle shape by adding a fixed value to all cells.
![](./images/parameters/sheight/sheight.png)


## Hill (positive curvature)

### Positive range
Radius of the hill shape on the grid. Controls how many cells in the grid are affected by this shape along both axis.

### Positive amplitude
The peak height of the hill.





## Smoothing

Takes the average of 16 neighboring cells, applied once after all shapes have been placed.
