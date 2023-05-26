const { default: axios } = require("axios");

exports.harvardFormatter = (data, searchTerm) => {
  const harvardArtObjects = [];
  if (!data.records) {
    return;
  }

  data.records.map((record) => {
    //console.log("record", record);
    const type = record.classification;
    if (type === "Paintings" || type === "Drawings" || type === "Prints") {
      if (record.primaryimageurl) {
        const artObj = {
          name: record.people ? record.people[0].displayname : "",
          title: record.title,
          img: record.primaryimageurl,
          date: record.datebegin,
        };
        // console.log("artObject", artObj);
        if (artObj.name.toLowerCase().match(searchTerm.toLowerCase())) {
          harvardArtObjects.push(artObj);
        }
      } else {
        return;
      }
    }
  });
  return harvardArtObjects;
};

exports.rijkArtObject = (data, searchTerm) => {
  if (!data.artObjects) {
    return;
  }
  const rijkArtObjects = [];
  data.artObjects.map(async (item) => {
    if (!item || !item.webImage.url) {
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
      console.log("rijk obj", artObj);
      rijkArtObjects.push(artObj);
    }
  });
  return rijkArtObjects;
};

exports.clevelandArtObject = (data, searchTerm) => {
  // create new obj with desired fields

  const allArtObjects = [];
  const values = Object.values(data.data);

  values.map((item) => {
    if (JSON.stringify(item.images) === "{}") {
      console.log("no image");
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
    console.log("clev artObj", artObj);
  });
  return allArtObjects;
};
