const { Engine, Render, Runner, World, Bodies } = Matter;

const cells = 3;
const width = 600;
const height = 600;

const unitLength = width / cells;

const engine = Engine.create();
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

// Walls
const walls = [
    // top
    Bodies.rectangle(width/2, 0, width, 40, { isStatic: true }),
    // bottom
    Bodies.rectangle(width/2, height, width, 40, { isStatic: true }),
    // left
    Bodies.rectangle(0, height/2, 40, height, { isStatic: true }),
    // right
    Bodies.rectangle(width, height/2, 40, height, { isStatic: true })
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

const grid = Array(cells).fill(null).map(() => Array(cells).fill(false));

const verticals = Array(cells).fill(null).map(() => Array(cells-1).fill(false));
const horizontals = Array(cells-1).fill(null).map(() => Array(cells).fill(false));

const startRow = Math.floor(Math.random() * cells);
const startColumn = Math.floor(Math.random() * cells);

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
            nextRow >= cells || 
            nextColumn < 0 || 
            nextColumn >= cells) {
            continue;
        }

        // if we have visited that neighbour, continue to next neighbour
        if (grid[nextRow][nextColumn]) {
            continue;
        }

        // remove a wall from either horizontals or verticals
        if (direction === `left`) {
            verticals[row][column-1] = true;
        } else if (direction === `right`) {
            verticals[row][column] = true;
        } else if (direction === `up`) {
            horizontals[row-1][column] = true;
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

horizontals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
        if (open) {
            return;
        }

        const wall = Bodies.rectangle(
                columnIndex * unitLength + unitLength / 2,
                rowIndex * unitLength + unitLength,
                unitLength,
                10,
                { isStatic: true });
        World.add(world, wall);

    });
});

verticals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
        if (open) {
            return;
        }

        const wall = Bodies.rectangle(
                columnIndex * unitLength + unitLength,
                rowIndex * unitLength + unitLength / 2,
                10,
                unitLength,
                { isStatic: true });
        World.add(world, wall);

    });
});
