import { Word } from "@/app/dictionary";
import { StyleSheet, Text, View } from "react-native";
import Forms from "../text_components/Forms";
import { CommonColors } from "@/constants/Colors";
import Type from "../dictionary/Type";
import Examples from "../dictionary/Examples";
import TextButton from "../TextButton";
import { i18n } from "../store/i18n";
import { useContext } from "react";
import { HintContext } from "../store/HintContext";
import { allWords, myDictionary, cachedWordsAndData } from "../util/WordsUtil";
import { useSignal } from "@preact/signals-react";
import { callCloudFunction } from "../util/CloudFunctions";
import { router } from "expo-router";

interface SearchItemProps {
  index: number;
  word: string;
}

function SearchItem(props: SearchItemProps) {
  const { showHint } = useContext(HintContext);


  function openWordPage() {
    router.push({ pathname: "/word_data", params: { word: props.word } });
  }

  const isHoveredIn = useSignal<boolean>(false);

  function onHoverIn() {
    isHoveredIn.value = true;
  }

  function onHoverOut() {
    isHoveredIn.value = false;
  }

  return (
    <View style={styles.itemContainer}>
      <TextButton
        style={[styles.wordContainer,
        isHoveredIn.value === true ?
          { backgroundColor: "rgba(223, 255, 255, 0.9)" }
          : { backgroundColor: CommonColors.white }]}
        text={props.word}
        onPress={openWordPage}
        textStyle={[styles.wordText, isHoveredIn.value === true ? { color: CommonColors.black } : { color: CommonColors.black }]}
        label={`Word: ${props.word}. Open link.`}
        onHoverIn={onHoverIn}
        onHoverOut={onHoverOut} />
    </View>
  );
}

export default SearchItem;

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    width: "100%",
    alignItems: "center",
  },
  wordContainer: {
    width: "100%",
    paddingHorizontal: 5,
    paddingVertical: 2.5,
  },
  wordText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600"
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
});
