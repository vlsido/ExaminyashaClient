import MaterialIconButton from "@/components/MaterialIconButton";
import TextButton from "@/components/TextButton";
import DictionaryItem from "@/components/dictionary/DictionaryItem";
import { i18n } from "@/components/store/i18n";
import Forms from "@/components/text_components/Forms";
import { callCloudFunction } from "@/components/util/CloudFunctions";
import { WordWithoutData, myDictionary } from "@/components/util/WordsUtil";
import { CommonColors } from "@/constants/Colors";
import { useSignal, useSignalEffect } from "@preact/signals-react";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";


export interface DictionaryRequest {
  page: number;
}

export interface RandomWordsResponse {
  randomWords: Word[];
}


export interface AllWordsResponse {
  dictionary: Word[];
}


export interface OnlyWordsResponse {
  dictionary: WordWithoutData[];
}

export interface Word {
  word: string;
  type?: "s" | "adj" | "adv" | "v" | undefined;
  forms?: string;
  usages: {
    definitionData: {
      definitionText?: string;
      russianTranslations: string[];
    }[];
    examples?: {
      estonianExample: string;
      russianTranslations: string[];
    }[];
  }[]
}

export interface DictionaryResponse {
  dictionary: Word[];
}

function Dictionary() {

  if (myDictionary.value.length === 0) {

    return (
      <View style={styles.noWordsContainer}>
        <Text style={styles.loadingText}>Siin pole midagi. Lisa uued sõnad eksami leheküljel.</Text>
      </View>
    );
  }


  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {i18n.t("count_words_in_dictionary", {
          defaultValue: "Sõnastikus on %{count} sõnad",
          count: myDictionary.value.length,
        })}
      </Text>
      <FlatList
        data={myDictionary.value}
        keyExtractor={(item) => `word-${myDictionary.value.indexOf(item)}`}
        contentContainerStyle={{ gap: 10 }}
        renderItem={({ item, index }) => <DictionaryItem {...item} index={index + 1} />}
      />
    </View>
  );
}

export default Dictionary;

const styles = StyleSheet.create({
  noWordsContainer: {
    flex: 1,
    width: "100%",
    paddingLeft: 10,
    paddingVertical: 15,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
    backgroundColor: "#222322"
  },
  container: {
    flex: 1,
    width: "100%",
    paddingLeft: 10,
    paddingVertical: 15,
    justifyContent: "center",
    flexDirection: "column",
    backgroundColor: "#222322"
  },
  loadingText: {
    fontSize: 20,
    color: CommonColors.white,
    textAlign: "center"
  },
  addContainer: {
    backgroundColor: "#f3f3f3",
    borderRadius: 10,
    margin: 10,
  },
  text: {
    color: "white",
    fontSize: 16
  },
});
