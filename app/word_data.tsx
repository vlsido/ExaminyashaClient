import { CommonColors } from "@/constants/Colors";
import { useSignal } from "@preact/signals-react";
import { useLocalSearchParams } from "expo-router";
import { useContext, useEffect } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { Word } from "./dictionary";
import { myDictionary, cachedWordsAndData } from "@/components/util/WordsUtil";
import { callCloudFunction } from "@/components/util/CloudFunctions";
import Forms from "@/components/text_components/Forms";
import Type from "@/components/dictionary/Type";
import Examples from "@/components/dictionary/Examples";
import TextButton from "@/components/TextButton";
import { i18n } from "@/components/store/i18n";
import { HintContext } from "@/components/store/HintContext";
import FoundArticlesCounter from "@/components/word_data/FoundArticlesCounter";

interface WordDataResponse {
  queryResponse: Word[];
}

function WordData() {
  const { word } = useLocalSearchParams<{ word: string }>();

  const wordData = useSignal<Word[] | null>(null);

  useEffect(() => {
    getWordData();
  }, []);

  function detectLanguage() {
    let estonianCount = 0;
    let cyrillicCount = 0;

    for (let i = 0; i < word.length; i++) {
      const charCode = word.charCodeAt(i);

      // Check for Cyrillic characters
      if ((charCode >= 0x0400 && charCode <= 0x04FF) ||
        (charCode >= 0x0500 && charCode <= 0x052F)) {
        cyrillicCount++;
      }
      // Check for general Latin characters (A-Z, a-z)
      // And check for Estonian specific characters
      else if ((charCode >= 0x0041 && charCode <= 0x005A) || (charCode >= 0x0061 && charCode <= 0x007A) || [0x00DC, 0x00FC, 0x00D5, 0x00F5, 0x00D6, 0x00F6, 0x00C4, 0x00E4, 0x017D, 0x017E, 0x0160, 0x0161].includes(charCode)) {
        estonianCount++;
      }
    }

    if (estonianCount > cyrillicCount) {
      return "estonian";
    } else if (cyrillicCount > estonianCount) {
      return "russian";
    } else {
      return "unknown";
    }
  }

  function normalizeRussianTranslation(translation: string) {
    return translation.replace(/\"/g, "").toLowerCase();
  }

  async function getWordData() {
    console.log("Open word", word);
    const language = detectLanguage();

    // if (cachedWordsAndData.value.length > 0) {
    //   if (language === "estonian") {
    //     console.log("Checking for Estonian words in history", cachedWordsAndData.value);
    //     const wordDataFromHistory = cachedWordsAndData.value.find((wordData) => wordData.word === word.toLowerCase());
    //
    //     if (wordDataFromHistory !== undefined) {
    //       wordData.value = [wordDataFromHistory];
    //       return;
    //     }
    //   } else if (language === "russian") {
    //
    //
    //     console.log("Checking for Russian words in history", cachedWordsAndData.value);
    //     const allMatchingAcrossAllWords = cachedWordsAndData.value.filter((wordData) => wordData.usages.some((usage) =>
    //       usage.definitionData.some((definition) =>
    //         definition.russianTranslations.some(
    //           (translation) =>
    //             normalizeRussianTranslation(translation) === word.toLowerCase(),
    //         ),
    //       ),
    //
    //     ));
    //
    //     if (allMatchingAcrossAllWords.length > 0) {
    //       wordData.value = allMatchingAcrossAllWords;
    //       return;
    //     }
    //   }
    // }

    console.log("Word data from history", cachedWordsAndData.value);

    const response = await callCloudFunction("GetWordData_Node", { word: word, language }) as WordDataResponse | undefined;

    if (response != null) {
      console.log("Response", response);

      wordData.value = response.queryResponse;
      // if (cachedWordsAndData.value.find((word) => word.word === response.queryResponse.at(0)?.word)) {
      //   return;
      // }
      // cachedWordsAndData.value = [...cachedWordsAndData.value, response.queryResponse.at(0)!];
    } else {
      alert("Ei leitud!");
      wordData.value = [];
    }
  }

  const { showHint } = useContext(HintContext);

  function addToDictionary(wordToAdd: Word) {
    if (wordData.value == null) {
      return;
    }

    console.log("added");

    if (myDictionary.value.find((word) => word.word === wordToAdd.word)) {
      showHint("Sõna on juba sõnastikus!", 500);
      return;
    }

    myDictionary.value = [...myDictionary.value, wordToAdd];
    cachedWordsAndData.value = [...cachedWordsAndData.value, wordToAdd];


    // Add to dictionary
    showHint("Lisatud!", 500);
  }


  if (wordData.value === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size={32} color={CommonColors.white} />
      </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <FoundArticlesCounter wordData={wordData} />
      {wordData.value.length > 0 ? wordData.value.map((wordData, wordDataIndex) => {
        return (
          <View key={`wordIndex-${wordDataIndex}`}>
            <Text key={`wordIndex-${wordDataIndex}-text`} style={styles.wordText}>
              {wordData.word}{" "}
            </Text>
            <Forms key={`wordIndex-${wordDataIndex}-forms`} forms={wordData.forms} />
            <Type key={`wordIndex-${wordDataIndex}-type`} type={wordData.type} />
            {wordData.usages.map((usage, usageIndex) => {
              return (
                <View key={`usage-${usageIndex}`}>
                  {usage.definitionData.map((definition, index) => {
                    const definitionIndexString: string = index === 0 ? `${usageIndex + 1}. ` : "\u25A0 "

                    return (
                      <View key={`usage-${wordDataIndex}-definition-${index}`}>
                        <Text key={`usage-${wordDataIndex}-definition-${index}-text`} style={styles.definitionText}>{definitionIndexString}{definition.definitionText}</Text>
                        {
                          definition.russianTranslations.map((translation, index) => {
                            const textElements: React.JSX.Element[] = [];
                            if (translation == null) {
                              console.log("Translation is null", translation);
                              return null;
                            }
                            const russianTranslationWordParts = translation.split("\"");

                            const russianTranslationWordPartsJoined = russianTranslationWordParts.join("");

                            // Iterate over the word parts and style the accented letter
                            for (let i = 0; i < russianTranslationWordParts.length; i++) {
                              if (i === 0) {
                                // The first part before the first quote is normal
                                textElements.push(<Text key={`usage-${wordDataIndex}-russian-translation-${index}-current-word-part-${i}`} style={styles.russianText}>{russianTranslationWordParts[i]}</Text>);
                              } else {
                                // The part after the quote, where the first letter is the accent
                                textElements.push(
                                  <Text key={`usage-${wordDataIndex}-russian-translation-${index}-current-word-part-${i}`} style={styles.russianAccentText}>{russianTranslationWordParts[i][0]}</Text>,
                                  <Text key={`usage-${wordDataIndex}-russian-translation-${index}-current-word-part-${i}-rest`} style={styles.russianText}>{russianTranslationWordParts[i].slice(1)}</Text>
                                );
                              }
                            }
                            if (normalizeRussianTranslation(russianTranslationWordPartsJoined).includes(normalizeRussianTranslation(word)) === true) {
                              return (
                                <View key={`usage-${wordDataIndex}-russian-translation-${index}-current-word-translation-view`} style={styles.wordPartsTogetherHighlighted}> {textElements} </View>
                              )
                            }

                            return (
                              <View key={`usage-${wordDataIndex}-russian-translation-${index}-current-word-translation-view`} style={styles.wordPartsTogether}> {textElements} </View>
                            )
                          })
                        }
                      </View>
                    )
                  })}
                  <Examples key={`wordIndex-${wordDataIndex}-examples`} examples={usage.examples} />
                </View>
              )


            })}
            <TextButton key={`wordIndex-${wordDataIndex}-add`} style={styles.addToDictionaryContainer} textStyle={styles.addToDictionaryText} text={i18n.t("add_to_dictionary", { defaultValue: "Lisa sõnastikku" })} onPress={() => addToDictionary(wordData)} label="Add to dictionary" />
          </View>
        );
      }) : <Text style={styles.notFoundText}>Ei leitud!</Text>}
    </ScrollView>
  );
}

export default WordData;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: CommonColors.black,
    justifyContent: "center",
    alignItems: "center"
  },
  container: {
    flexGrow: 1,
    backgroundColor: CommonColors.black,
    padding: 15
  },

  wordContainer: {
    margin: 10,
  },
  wordText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold"
  },
  definitionText: {
    color: "rgba(243, 245, 243, 0.8)",
    fontSize: 16
  },
  indexText: {
    color: CommonColors.white,
    fontSize: 14,
    marginTop: 5,
    marginRight: 5
  },
  russianText: {
    color: CommonColors.purple,
    fontSize: 16,
    fontWeight: "bold"
  },
  russianAccentText: {
    color: CommonColors.yellow,
    fontSize: 16,
    fontWeight: "bold"
  },
  wordPartsTogether: {
    flexDirection: "row",
  },
  wordPartsTogetherHighlighted: {
    flexDirection: "row",
    backgroundColor: "rgba(241, 241, 240, 0.1)",
    borderRadius: 5,
    marginRight: "auto",
  },
  addToDictionaryContainer: {
    marginVertical: 20,
    marginRight: "auto",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    borderColor: CommonColors.white,
    borderWidth: 1,
  },
  addToDictionaryText: {
    fontSize: 16,
    color: CommonColors.white,
  },
  notFoundText: {
    color: CommonColors.white,
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center"
  }
});
