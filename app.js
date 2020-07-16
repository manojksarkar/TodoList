
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(process.env.URI, {useUnifiedTopology: true, useNewUrlParser: true});

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Eat"
});

const item2 = new Item({
    name: "Code"
});

const item3 = new Item({
    name: "Sleep"
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});


const List = new mongoose.model("list", listSchema);

app.get("/", function(req, res) {

  Item.find(function(err, foundItems){
    
    if(foundItems.length === 0) 
    {
      Item.insertMany(defaultItems, function(err){
        if(err) 
          console.log(err);
        else
          console.log("Succesfully Added The DefaultItems");
          
      });

      res.redirect("/");
    }
    
    else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
});


app.get("/about", function(req, res){
  res.render("about");
});

app.get("/:customListName", function(req,res){

  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList){
    if(!err){
      if(!foundList){
        
        const list = new List({
          name: customListName,
          items: defaultItems
        });
      
        list.save();
        res.redirect("/" + customListName);
      }
      else{
  
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });
});


app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listTitle = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listTitle === "Today") {
    
    item.save();
    res.redirect("/");
  }else{

    List.findOne({name: listTitle}, function(err, foundList){
      
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listTitle);
    });
  }
});

app.post("/delete", function(req, res){
  var checkedItemId = req.body.checkbox;
  var listTitle = req.body.listName;

  if(listTitle === "Today"){
  
    Item.deleteOne({_id: checkedItemId}, function(err){
      if(err)
        console.log(err);
      else 
        console.log("Successfully Deleted");
    });
  
    res.redirect("/");
  }
  else {

    List.findOneAndUpdate({name: listTitle}, {$pull: {items: {_id: checkedItemId}}}, function(err,foundList){
      if(!err){
        res.redirect("/" + listTitle);
      }
    });
  }
  
  
});


let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function() {
  console.log("Server has started Successfully");
});
