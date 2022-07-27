const { default: axios } = require("axios");

exports.harvardFormatter = (data, searchTerm) => {
  const harvardArtObjects = [];
  if (!data.records) {
    return;
  }
  
  data.records.map((record) => {
    const type = record.classification;
    if (type === "Paintings" || type === "Drawings") {
      if (record.primaryimageurl) {
        const artObj = {
          name: record.people ? record.people[0].displayname : "",
          title: record.title,
          img: record.primaryimageurl,
          date: record.datebegin,
        };

        if (artObj.name.toLowerCase().match(searchTerm.toLowerCase())) {
          harvardArtObjects.push(artObj);
        }
      }
    }
  });
  return harvardArtObjects;
};

exports.rijkArtObject = (data, searchTerm) => {
  if (!data.artObjects) {
    return;
  }
  const allArtObjects = [];
  data.artObjects.map(async (item) => {
    if (!item) {
      return;
    }
    if (
      !item.principalOrFirstMaker
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    ) {
      return;
    }
    const title = item.title;
    const artObj = {
      name: item.principalOrFirstMaker,
      title: title,
      img: item.webImage.url,
      caption: "",
      date: "",
      containerTitle: "",
    };
    if (artObj.img) {
      allArtObjects.push(artObj);
    }
  });
  return allArtObjects;
};

exports.clevelandArtObject = (data, searchTerm) => {
  // create new obj with desired fields
  const allArtObjects = [];

  const values = Object.values(data.data);
  values.map((item) => {
    if (!item.images) {
      return;
    }
    const artObj = {
      name: item.creators[0].description.split("(")[0],
      title: item.title.split(" ").splice(0, 6).join(" "),
      img: item.images.web.url,
      date: item.creation_date,
      containerTitle: "",
    };

    allArtObjects.push(artObj);
    console.log(artObj);
  });
  return allArtObjects;
};
