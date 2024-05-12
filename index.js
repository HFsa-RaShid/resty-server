const express = require ('express');
    const cors = require('cors');
    require('dotenv').config();
    const { MongoClient, ServerApiVersion,ObjectId } = require('mongodb');
    const app = express();
    const port = process.env.PORT || 5000;
    // middleWare
    app.use(cors());
    app.use(express.json())

 
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.aq8mwv9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const allrooms = client.db("allroomsDB");
    const allroomsCollection = allrooms.collection("allrooms");


    app.get('/allrooms', async(req,res) =>{
        
        const cursor = allroomsCollection.find();
        const result = await cursor.toArray();
        res.send(result);
  
      })


      app.get('/allrooms/:id', async(req,res) => {
        const id = req.params.id;
        // console.log(id);
        const query = { _id: new ObjectId(id) };
        const review = await allroomsCollection.findOne(query);
        res.send(review);
      })



      app.put('/allrooms/:id', async (req, res) => {
        const id = req.params.id;
        const newAvailability = req.body.availability;
        // console.log(newAvailability)
  
       
          const query = { _id: new ObjectId(id) };
        //   const options = { upsert: true };
          const update = { 
            $set: 
            { 
                availability: newAvailability 
            } 
        };
          const result = await allroomsCollection.updateOne(query, update);
         
          if (result.modifiedCount === 1) {
            res.send({ success: true, message: 'Room availability updated successfully' });
          } 
       
      });



      const userInfo = client.db("userInfoDB");
      const userCollection = userInfo.collection("userInfo");
      
      app.post('/bookings', async (req, res) => {
       
            const newBooking = req.body;
            // console.log(newBooking)
            const result = await userCollection.insertOne(newBooking);
            res.json({ success: true, message: 'Room booked successfully.' });
       
        });

        app.get('/myBookings/:email', async(req,res) =>{
        
          const cursor = userCollection.find();
          const result = await cursor.toArray();
          res.send(result);
    
        })
        
        // Cancel Booking and Update Room Availability
      app.delete('/allrooms/:bookingId', async (req, res) => {
      const bookingId = req.params.bookingId;
  
      const bookingQuery = { _id: new ObjectId(bookingId) };
      const booking = await userCollection.findOne(bookingQuery);
      const roomId = booking.room._id;
     
      const bookingResult = await userCollection.deleteOne(bookingQuery);

      const availabilityQuery = { _id: new ObjectId(roomId) }; 
      const update = { 
        $set: 
          { 
            availability: true 
          } 
        }; 
      const Result = await allroomsCollection.updateOne(availabilityQuery, update);
      res.send(Result)

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