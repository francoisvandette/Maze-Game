const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

// const cells = 8;

const width = window.innerWidth;
const height = window.innerHeight;



const cellsHorizontal = 14;
const cellsVertical = 13;
// const a = Math.floor(width / height * cellsHorizontal);
// const b = Math.floor(height / width * cellsHorizontal);
// const cellsVertical = Math.max(a,b);

const unitLengthX = width / cellsHorizontal;
const unitLengthY = height / cellsVertical;

const engine = Engine.create();
engine.world.gravity.y = 0;
const { world } = engine;
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        width: width,
        height: height,
        wireframes: false
    }
});
Render.run(render);
Runner.run(Runner.create(), engine);

// Walls / Borders
const walls = [
    // top
    Bodies.rectangle(
        width / 2, 0, 
        width, 2, 
        { 
            isStatic: true
        }),
    // bottom
    Bodies.rectangle(
        width / 2, height, 
        width, 2, 
        { 
            isStatic: true 
        }),
    // left
    Bodies.rectangle(
        0, height/2, 
        2, height, 
        { 
            isStatic: true 
        }),
    // right
    Bodies.rectangle(
        width, height/2, 
        2, height, 
        { 
            isStatic: true 
        })
];
World.add(world, walls);

// Maze Generation

const shuffle = (arr) => {
    let counter = arr.length;

    while (counter > 0) {
        const index = Math.floor(Math.random() * counter);
        counter--;
        const temp = arr[counter];
        arr[counter] = arr[index];
        arr[index] = temp;
    }

    return arr;
};

const grid = Array(cellsVertical).fill(null).map(() => Array(cellsHorizontal).fill(false));

const verticals = Array(cellsVertical).fill(null).map(() => Array(cellsHorizontal-1).fill(false));

const horizontals = Array(cellsHorizontal-1).fill(null).map(() => Array(cellsVertical).fill(false));

const startRow = Math.floor(Math.random() * cellsVertical);
const startColumn = Math.floor(Math.random() * cellsHorizontal);

const stepThroughCell = (row, column) => {
    // if I have visited the cell at [row, column], then return
    if (grid[row][column]) {
        return;
    }

    // mark this cell as being visited
    grid[row][column] = true;

    // assemble randomly-ordered list of neighbours
    const neighbours = shuffle([
        [row - 1, column, `up`],
        [row, column +1, `right`],
        [row + 1, column, `down`],
        [row, column - 1, `left`]
    ]);
    // console.log(neighbours);

    // for each neighbour...
    for (let neighbour of neighbours) {
        const [ nextRow, nextColumn, direction ] = neighbour;
        //see if that neighbour is out of bounds
        if (nextRow < 0 || 
            nextRow >= cellsVertical || 
            nextColumn < 0 || 
            nextColumn >= cellsHorizontal) {
            continue;
        }

        // if we have visited that neighbour, continue to next neighbour
        if (grid[nextRow][nextColumn]) {
            continue;
        }

        // remove a wall from either horizontals or verticals
        if (direction === `left`) {
            verticals[row][column - 1] = true;
        } else if (direction === `right`) {
            verticals[row][column] = true;
        } else if (direction === `up`) {
            horizontals[row - 1][column] = true;
        } else if (direction === `down`) {
            horizontals[row][column] = true;
        }

        // visit that next cell
        // console.log(JSON.parse(JSON.stringify(grid)));
        stepThroughCell(nextRow, nextColumn);
    };


};

stepThroughCell(startRow, startColumn);
// console.log(grid, verticals, horizontals);

const wallThickness = 10;

horizontals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
        if (open) {
            return;
        }

        const wall = Bodies.rectangle(
                columnIndex * unitLengthX + unitLengthX / 2,
                rowIndex * unitLengthY + unitLengthY,
                unitLengthX + wallThickness / 2,
                wallThickness,
                { 
                    isStatic: true,
                    label: `wall`
                });
        World.add(world, wall);

    });
});

verticals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
        if (open) {
            return;
        }

        const wall = Bodies.rectangle(
                columnIndex * unitLengthX + unitLengthX,
                rowIndex * unitLengthY + unitLengthY / 2,
                wallThickness,
                unitLengthY + wallThickness / 2,
                {
                    isStatic: true,
                    label: `wall`
                });
        World.add(world, wall);

    });
});

// Goal

const goal = Bodies.rectangle(
    width - unitLengthX / 2,
    height - unitLengthY / 2,
    unitLengthX * 0.7,
    unitLengthY * 0.7,
    { 
        isStatic: true,
        label: `goal`
    }
);
World.add(world, goal);

// Ball

const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;

const ball = Bodies.circle(
    unitLengthX / 2,
    unitLengthY / 2,
    ballRadius,
    {
        label: `ball`
    }
);
World.add(world, ball);

document.addEventListener(`keydown`, (event) => {
    // console.log(event);
    const { x, y } = ball.velocity;
    // console.log(x,y);
    if (event.keyCode === 87 || event.keyCode === 38) {
        // console.log(`move ball UP`);
        Body.setVelocity(ball, { x: x, y: -5 });
    }
    if (event.keyCode === 83 || event.keyCode === 40) {
        // console.log(`move ball DOWN`);
        Body.setVelocity(ball, { x: x, y: 5 });
    }
    if (event.keyCode === 65 || event.keyCode === 37) {
        // console.log(`move ball LEFT`);
        Body.setVelocity(ball, { x: -5, y: y });
    }
    if (event.keyCode === 68 || event.keyCode === 39) {
        // console.log(`move ball RIGHT`);
        Body.setVelocity(ball, { x: 5, y: y });
    }
});

// Win Condition

Events.on(engine, `collisionStart`, event => {
    event.pairs.forEach((collision) => {
        const labels = [`ball`, `goal`];

        if (
            labels.includes(collision.bodyA.label) && 
            labels.includes(collision.bodyB.label)
        ) {
            // console.log(`User won!`);
            world.gravity.y = 1;
            world.bodies.forEach(body => {
                if (body.label === `wall`) {
                    Body.setStatic(body, false);
                }
            })
        }
    });
})