const express = require ('express');
    const cors = require('cors');
    const jwt = require('jsonwebtoken');
    const cookieParser = require('cookie-parser')
    require('dotenv').config();
    const { MongoClient, ServerApiVersion,ObjectId } = require('mongodb');
    const app = express();
    const port = process.env.PORT || 8000;
    // middleWare
    app.use(cors(
      {
        origin: [
          'http://localhost:5173',
          'http://localhost:5174'
        ],
        credentials: true
      }
    ));
    app.use(express.json());
    app.use(cookieParser());

 
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.aq8mwv9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


// middlewares
const logger = (req, res, next) =>{
  // console.log('log: info',req.method, req.url);
  next();
}

const verifyToken = (req, res, next) =>{
  const token = req?.cookies?.token;
  // console.log('token in the middleware: ', token);
  if(!token){
    return res.status(401).send({message: 'unauthorized access'})
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) =>{
    if(err){
      return res.status(401).send({message: 'unauthorized access'})
    }
    req.user = decoded;
    next();
  }
)
  
}


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

      
      const allroomsDB = client.db("allroomsDB");
      const allroomsCollection = allroomsDB.collection("allrooms");
  
      const userInfoDB = client.db("userInfoDB");
      const userCollection = userInfoDB.collection("userInfo");

      const BookingReview = client.db("bookingRoomReviewDB");
    const BookingRoomReviewCollection = BookingReview.collection("BookingReview");
  

    // auth related api
    app.post('/jwt', logger, async(req,res) =>{
      const user = req.body;
      // console.log('user for token', user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'});
      res.cookie('token', token,{
        httpOnly: true,
        secure: true,
        sameSite: 'none'
      })
      .send({success: true});


    })

    app.post('/logout', async(req, res) =>{
      const user = req.body;
      // console.log('logging out', user);
      res.clearCookie('token', {maxAge: 0, sameSite: 'none', secure: true});
      res.send({success: true})
    })


    app.get('/allrooms', async (req, res) => {
      const minPrice = parseFloat(req.query.minPrice);
      const maxPrice = parseFloat(req.query.maxPrice);
  
      let query = {};
  
      if (!isNaN(minPrice) && !isNaN(maxPrice)) {
          query.pricePerNight = { $gte: minPrice, $lte: maxPrice };
      } else if (!isNaN(minPrice)) {
          query.pricePerNight = { $gte: minPrice };
      } else if (!isNaN(maxPrice)) {
          query.pricePerNight = { $lte: maxPrice };
      }
  
          const cursor = allroomsCollection.find(query);
          const result = await cursor.toArray();
          // console.log(result)
          res.send(result);
      
  });
  
  
      app.get('/allrooms/:id', async (req, res) => {
    
          const id = req.params.id;
          if (!ObjectId.isValid(id)) {
            return res.send({ error: 'Invalid ID format' });
          }
          const query = { _id: new ObjectId(id) };
          const room = await allroomsCollection.findOne(query);
         
          res.send(room);
      });
  
      app.put('/allrooms/:id', async (req, res) => {
        
          const id = req.params.id;
          if (!ObjectId.isValid(id)) {
            return res.send({ error: 'Invalid ID format' });
          }
          const newAvailability = req.body.availability;
          const query = { _id: new ObjectId(id) };
          const update = {
            $set: { availability: newAvailability },
          };
          const result = await allroomsCollection.updateOne(query, update);
          if (result.modifiedCount === 1) {
            res.send({ success: true, message: 'Room availability updated successfully' });
          } 
          
       
      });
  
      app.post('/myBookings', async (req, res) => {
          const newBooking = req.body;
          const result = await userCollection.insertOne(newBooking);
          res.json({ success: true, message: 'Room booked successfully.' }); 
      });
  

      app.get('/myBookings', async (req, res) => {
       
          const cursor = userCollection.find();
          const result = await cursor.toArray();
         
          res.send(result);
       
      });

      app.get('/myBookings/:id', async (req, res) => {
      
          const id = req.params.id;
          if (!ObjectId.isValid(id)) {
            return res.send({ error: 'Invalid ID format' });
          }
          const query = { _id: new ObjectId(id) };
          const booking = await userCollection.findOne(query);
          res.send(booking);
        
      });
  
      app.get('/myBookings/email/:email', logger,verifyToken, async (req, res) => {
        
          const email = req.params.email;
          // console.log('token owner info',req.user);
          if (req.user.email !== email) {
            return res.status(403).send({ message: 'Forbidden access' });
          }
          const cursor = userCollection.find({ userEmail: email });
          const result = await cursor.toArray();
          res.send(result);
        
      });

      app.put('/myBookings/:id', async (req, res) => {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
          return res.send({ error: 'Invalid ID format' });
        }
        const query = { _id: new ObjectId(id) };

        // const options = { upsert: true };
        const updatedDate = req.body.selectedDate;
        
        const update = {
          $set: { selectedDate: updatedDate },
        };
        const result = await userCollection.updateOne(query, update);  
        res.send(result)
      });

  
      app.delete('/myBookings/:bookingId', async (req, res) => {
          const bookingId = req.params.bookingId;
          const email = req.body.email;
          if (!ObjectId.isValid(bookingId)) {
            return res.send({ error: 'Invalid ID format' });
          }
  
          const bookingQuery = { _id: new ObjectId(bookingId), userEmail: email };
          const booking = await userCollection.findOne(bookingQuery);
          if (!booking) {
            return res.status(404).send({ error: 'Booking not found' });
          }
  
          const roomId = booking.room._id;
          const bookingResult = await userCollection.deleteOne(bookingQuery);
          const availabilityQuery = { _id: new ObjectId(roomId) };
          const update = {
            $set: { availability: true },
          };
          await allroomsCollection.updateOne(availabilityQuery, update);
  
          res.json({ success: true, message: 'Booking cancelled successfully.' });
        
      });

      app.post('/reviews', async(req,res) =>{
        const review = req.body;
        // console.log('new user', review);
        const result = await BookingRoomReviewCollection.insertOne(review);
        res.send(result);
    })

  
 
app.get('/reviewForRoom', async (req, res) => {
    const cursor = BookingRoomReviewCollection.find().sort({ timestamp: -1 });
    const reviews = await cursor.toArray();
    res.send(reviews);
});



app.get('/reviewForRoom/roomNumber/:roomNumber', async (req, res) => {
  const roomNumber = parseInt(req.params.roomNumber, 10); 

      const cursor = BookingRoomReviewCollection.find({ roomNumber: roomNumber });
      const result = await cursor.toArray();
      // console.log(result);
      res.send(result);
 
});

    
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



    app.get('/', (req,res) =>{
        res.send('RestY crud is running')
    })
    
    app.listen(port, () =>{
        console.log(`RestY crud port, ${port}`)
    })

    const isValidObjectId = (id) => {
      return ObjectId.isValid(id) && new ObjectId(id).toString() === id;
    };