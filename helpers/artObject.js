const { default: axios } = require("axios");
const { title } = require("process");

exports.articArtFormatter = (data, searchTerm) => {
  const articArtFormatted = [];
  if (!title) {
    return;
  }

  // url for each image
  console.log("data", data);
  const url = `${data.data.config.iiif_url}/${data.data.data.image_id}/full/843,/0/default.jpg`;
  console.log(url);
  const artObj = {
    name: searchTerm,
    title: title,
    img: url,
  };

  articArtFormatted.push(artObj);

  return articArtFormatted;
};

exports.metArtFormatter = async (data, searchTerm) => {
  let ids = [];

  for (let i = 0; i < data.objectIDs.length; i++) {
    console.log("ID", data.objectIDs[i], i);
    ids.push(data.objectIDs[i]);
    if (i > 5) {
      break;
    }
  }
  console.log("IDS", ids);

  const metArtObjs = [];
  await Promise.all(
    ids.map(async (id) => {
      const url = `https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`;
      const call = await axios.get(url);
      const artObj = {
        name: call.data.artistDisplayName || "",
        title: call.data.title,
        img: call.data.primaryImage,
      };

      if (artObj.name.toLowerCase().match(searchTerm.toLowerCase())) {
        metArtObjs.push(artObj);
      }
    }),
  );
  console.log("Objs", metArtObjs);
  return metArtObjs;
};

exports.harvardFormatter = (data, searchTerm) => {
  //console.log("data", data);
  const harvardArtObjects = [];
  if (!data.records) {
    return;
  }

  data.records.map((record) => {
    const type = record.classification;
    if (type === "Paintings" || type === "Drawings" || type === "Prints") {
      if (record.primaryimageurl) {
        const artObj = {
          name: record.people ? record.people[0].displayname : "",
          title: record.title,
          img: record.primaryimageurl,
          date: record.datebegin,
        };
        //harvardArtObjects.push(artObj);
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
  console.log("DATA", data);
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
      rijkArtObjects.push(artObj);
    }
  });
  return rijkArtObjects;
};
