express = require("express")
router = express.Router()
const con = require('../public/server');

router.get("/routes", (req, res) => {
    const sql = "SELECT * FROM routes";

    con.query(sql, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
})


router.get('/route/:route_id', (req, res) => {
    const route_id = req.params.route_id;
    const sql = 'SELECT * FROM waypoints INNER JOIN routes ON routes.route_id = waypoints.route_id WHERE routes.route_id = ?';
    con.query(sql, [route_id], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        // Convert the waypoints string to an array
        const parsedResults = results.map(result => {
            if (result.waypoints) {
                result.waypoints = JSON.parse(result.waypoints);
            }
            return result;
        });

        res.json(parsedResults);
    });
});

router.post('/insert-route', async (req, res) => {
    // Get the data from the request body
    const username = req.body.username;
    const routeNumber = req.body.routeNumber;
    const routeName = req.body.routeName;
    const routeColor = req.body.routeColor;
    const waypoints = JSON.stringify(req.body.routeWaypoints);


    const query = 'INSERT INTO routes (route_number, route_name, username, route_color, fare_id) VALUES (?, ?, ?, ?, ?)';
    const values = [routeNumber, routeName, username, routeColor, 1];

    con.query(query, values, (err, result) => {
        if (err) {
            console.error('Error inserting data:', err);
            res.status(500).json({ message: 'Error inserting data into routes' });
            return;
        }
        const route_id = result.insertId;
        const query2 = 'INSERT INTO waypoints (route_id, waypoints) VALUES (?, ?)';
        const values2 = [route_id, waypoints];

        con.query(query2, values2, (err, result) => {
            if (err) {
                console.error('Error inserting data:', err);
                res.status(500).json({ message: 'Error inserting data into waypoints' });
                return;
            }
            console.log('Data inserted successfully');
            res.status(201).json({ message: 'Data inserted successfully', route_id: route_id });
        });
    });
});

//Update route
router.put('/update-route', async (req, res) => {
    // Get the data from the request body
    console.log(req.body)
    const username = req.body.username;
    const routeNumber = req.body.routeNumber;
    const routeName = req.body.routeName;
    const routeColor = req.body.routeColor;
    const routeId = req.body.routeId;
    const waypoints = JSON.stringify(req.body.routeWaypoints);


    const query = 'UPDATE routes SET route_number = ?, route_name = ?, username = ?, route_color = ? WHERE route_id = ?';
    const values = [routeNumber, routeName, username, routeColor, routeId];

    con.query(query, values, (err, result) => {
        if (err) {
            console.error('Error inserting data:', err);
            res.status(500).json({ message: 'Error updating data into routes' });
            return;
        }

        const query2 = 'UPDATE waypoints SET waypoints = ? WHERE route_id = ?';
        const values2 = [waypoints, routeId];

        con.query(query2, values2, (err, result) => {
            if (err) {
                console.error('Error inserting data:', err);
                res.status(500).json({ message: 'Error inserting data into waypoints' });
                return;
            }
            console.log('Data inserted successfully');
            res.status(201).json({ message: 'Data inserted successfully', routeName });
        });
    });
});


//API to get username
router.get('/username', (req, res) => {
    if (req.session.user) {
        res.status(200).json({ username: req.session.user.username });
    } else {
        res.status(401).json({ message: 'Not logged in' });
    }
});

//API for fare-matrix
router.get('/fare-matrix', async (req, res) => {
    const sql = 'SELECT * FROM fare_matrix WHERE fare_id = 1';
    con.query(sql, (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.status(200).json(result[0]);
    });
});

router.post('/update-fare-matrix', async (req, res) => {
    const { traditional_1st4km, traditional_succeeding, modernized_1st4km, modernized_succeeding } = req.body;

    const sql = 'UPDATE fare_matrix SET traditional_1st4km = ?, traditional_succeeding = ?, modernized_1st4km = ?, modernized_succeeding = ? WHERE fare_id = 1';
    const values = [traditional_1st4km, traditional_succeeding, modernized_1st4km, modernized_succeeding];

    con.query(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.status(200).send('Fare matrix updated');
    });
});

//API for get a single route data
router.get('/get-route/:routeId', (req, res) => {
    const routeId = req.params.routeId;
    const query = 'SELECT * FROM routes WHERE route_id = ?';

    con.query(query, [routeId], (err, result) => {
        if (err) {
            console.error('Error getting route:', err);
            res.status(500).send('Internal Server Error');
            return;
        }

        console.log(result)
        res.json(result);
    });
});

//API to get a single route waypoints
router.get('/get-waypoints/:routeId', (req, res) => {
    const routeId = req.params.routeId;
    const query = 'SELECT * FROM waypoints WHERE route_id = ?';

    con.query(query, [routeId], (err, result) => {
        if (err) {
            console.error('Error getting route:', err);
            res.status(500).send('Internal Server Error');
            return;
        }

        console.log(result)
        res.json(result);
    });
});


router.delete('/delete-route/:routeId', (req, res) => {
    const routeId = req.params.routeId;
    const query = 'DELETE FROM routes WHERE route_id = ?';

    con.query(query, [routeId], (err, result) => {
        if (err) {
            console.error('Error deleting route:', err);
            res.status(500).send('Internal Server Error');
            return;
        }

        res.status(200).send('Route deleted successfully');
    });
});

//API to get all waypoints
router.get('/routing-waypoints', async (req, res) => {
    const sql = 'SELECT * FROM waypoints';
    con.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
            return;
        }

        const resultWaypoints = {};

        for (const result of results) {
            resultWaypoints[result.route_id] = JSON.parse(result.waypoints);
        }

        res.json(resultWaypoints);
    });
});

module.exports = router