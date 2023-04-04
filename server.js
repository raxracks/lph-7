const app = require("express")();
const { summarize } = require("./textrank");
const { stopwords } = require("./stopwords");

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

const google = require("googlethis");

const options = {
  page: 0,
  safe: false,
  parse_ads: false,
  additional_params: {
    hl: "en",
  },
};

function calculateScore(word1, word2) {
  let target = word1.length < word2.length ? word1.length : word2.length;
  let score = word1.length === word2.length ? 3 : 0;

  for (let i = 0; i < target; i++) {
    if (word1[i] === word2[i]) score++;
  }

  return score;
}

function removeBad(sentence) {
  return sentence
    .toLowerCase()
    .split(" ")
    .filter(
      (word) =>
        ![
          "what",
          "how",
          "where",
          "why",
          "who",
          "when",
          "it",
          "is",
          "of",
          "to",
          "be",
          "the",
          "can",
          "me",
        ].includes(word)
    )
    .join(" ");
}

function endsWithStopword(sentence) {
  for (let i = 0; i < stopwords.length; i++) {
    if (sentence.sentence.endsWith(stopwords[i])) {
      return true;
    }
  }
}

function removeDuplicates(array) {
  return [...new Set(array)];
}

function removeStopwordEndings(array) {
  return array.filter((item) => !endsWithStopword(item));
}

function cleanDescription(description) {
  return description
    .replace(/\d+\/\d+\/\d+/g, "")
    .replace(/\.\.+/g, "")
    .replace(/\.\.+/g, "")
    .replace(/\d+\s+\w+\s+\w+/g, "")
    .replace(/(,|,\s+)$/g, "")
    .replaceAll("—", "");
}

function removeNoncapitalStarters(array) {
  return array.filter(
    (item) => item.sentence[0].toUpperCase() === item.sentence[0]
  );
}

app.get("/message", async (req, res) => {
  const sentences = [];
  const query = req.query.q;

  const response = await google.search(query, options);

  response.results.forEach((result) => {
    let sens = cleanDescription(result.description)
      .split(/[^a-z '-]/gi)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length !== 0);

    sens.forEach((sen) => {
      sentences.push({ sentence: sen, url: result.url });
    });
  });

  let results = [];

  sentences.forEach((sentenceGroup) => {
    let sentence = sentenceGroup.sentence;
    sentences.forEach((sentenceGroup2) => {
      let sentence2 = sentenceGroup2.sentence;
      if (sentence === sentence2) return;

      let words1 = removeBad(sentence).split(" ");
      let words2 = removeBad(sentence2).split(" ");
      let words3 = removeBad(query).split(" ");
      let score = 0;

      words1.forEach((word) => {
        words2.forEach((word2) => {
          score += calculateScore(word, word2) / (Math.random() * 2);
        });
      });

      words2.forEach((word) => {
        words1.forEach((word2) => {
          score += calculateScore(word, word2) / (Math.random() * 2);
        });
      });

      words3.forEach((word) => {
        words1.forEach((word2) => {
          score += calculateScore(word, word2) * (5 + Math.random() * 5);
        });
      });

      words3.forEach((word) => {
        words2.forEach((word2) => {
          score += calculateScore(word, word2) * (5 + Math.random() * 5);
        });
      });

      results.push({ sentenceGroup, score });
    });
  });

  results.sort((a, b) => b.score - a.score);
  results = results.map((result) => result.sentenceGroup);
  results = results.filter((result) => result.sentence.split(" ").length > 2);
  results.sort((a, b) => b.sentence.length - a.sentence.length);

  let knowledgePanel = response.knowledge_panel;

  let result = summarize(
    removeNoncapitalStarters(removeStopwordEndings(removeDuplicates(results)))
  );

  res.send({ result, knowledgePanel });
});

app.listen(3232, () => {
  console.log(`Running at http://127.0.0.1:3232`);
});
