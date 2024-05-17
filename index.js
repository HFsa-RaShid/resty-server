const express = require ('express');
    const cors = require('cors');
    require('dotenv').config();
    const { MongoClient, ServerApiVersion,ObjectId } = require('mongodb');
    const app = express();
    const port = process.env.PORT || 8000;
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

      
      const allroomsDB = client.db("allroomsDB");
      const allroomsCollection = allroomsDB.collection("allrooms");
  
      const userInfoDB = client.db("userInfoDB");
      const userCollection = userInfoDB.collection("userInfo");
  
      app.get('/allrooms', async (req, res) => {
       
          const cursor = allroomsCollection.find();
          const result = await cursor.toArray();
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
  
      app.get('/myBookings/:id', async (req, res) => {
      
          const id = req.params.id;
          if (!ObjectId.isValid(id)) {
            return res.send({ error: 'Invalid ID format' });
          }
          const query = { _id: new ObjectId(id) };
          const booking = await userCollection.findOne(query);
          res.send(booking);
        
      });
  
      app.get('/myBookings/email/:email', async (req, res) => {
        
          const email = req.params.email;
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