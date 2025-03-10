import {
  useCallback,
  useEffect,
  useMemo,
  useRef
} from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { CommonColors } from "../constants/Colors";
import { WordAndExamData } from "./(tabs)/dictionary";
import { router, useLocalSearchParams } from "expo-router";
import {
  useAppDispatch,
  useAppSelector
} from "../hooks/storeHooks";
import {
  atom,
  useAtom,
  useAtomValue,
} from "jotai";
import ExamWordComponent from "../components/screens/translate/ExamWordComponent";
import TextAnswerField from "../components/screens/translate/TextAnswerField";
import {
  answerAtom,
  isA1LevelOnAtom,
  isA2LevelOnAtom,
  isB1LevelOnAtom
} from "../components/screens/translate/translateAtoms";
import { useHint } from "../hooks/useHint";
import { setExamDictionary } from "../components/store/slices/dictionarySlice";
import { SkipNextIcon } from "../components/icons/SkipNextIcon";
import { VisibilityIcon } from "../components/icons/VisibilityIcon";
import CustomIconButton from "../components/buttons/CustomIconButton";
import { i18n } from "../components/store/i18n";
import AnswerStatusOverlay from "../components/overlays/AnswerStatusOverlay";
import TranslateWordsGameResults, {
  ResultsData
} from "../components/screens/translate/results/TranslateWordsGameResults";
import { TranslateGameMode } from "../constants/types";


export default function Translate() {
  const { mode, quantity } = useLocalSearchParams<{ mode: TranslateGameMode, quantity: string }>();

  const { showHint } = useHint();

  const myDictionary = useAppSelector((state) => state.dictionary.myDictionary);

  const examDictionary = useAppSelector((state) => state.dictionary.examDictionary);

  const dispatch = useAppDispatch();

  const textInputRef = useRef<TextInput>(null);

  const [wasPopulated, setWasPopulated] =
    useAtom<boolean>(useMemo(
      () => atom<boolean>(false),
      []
    ));

  const [
    gameWords,
    setGameWords
  ] = useAtom<WordAndExamData[]>(useMemo(() => atom<WordAndExamData[]>([]), []));

  const [resultsData, setResultsData] =
    useAtom<ResultsData[]>(useMemo(() => atom<ResultsData[]>([]), []));

  const [
    answer,
    setAnswer
  ] = useAtom<string>(answerAtom);

  const isA1LevelOn = useAtomValue(isA1LevelOnAtom);
  const isA2LevelOn = useAtomValue(isA2LevelOnAtom);
  const isB1LevelOn = useAtomValue(isB1LevelOnAtom);


  const [
    isAnswerValid,
    setIsAnswerValid
  ] = useAtom<boolean>(useMemo(
    () => atom<boolean>(false),
    []
  ));

  const [
    isAnswerVisible,
    setIsAnswerVisible
  ] = useAtom<boolean>(useMemo(
    () => atom<boolean>(false),
    []
  ));

  const [
    correctCount,
    setCorrectCount
  ] = useAtom<number>(useMemo(
    () => atom<number>(0),
    []
  ));

  const [
    incorrectCount,
    setIncorrectCount
  ] = useAtom<number>(useMemo(
    () => atom<number>(0),
    []
  ));

  const [
    lastIncorrectWord,
    setLastIncorrectWord
  ] = useAtom<string>(useMemo(
    () => atom<string>(""),
    []
  ));

  function shuffleArray(array: WordAndExamData[]) {
    let newIndex: number;

    array.forEach((
      _, index
    ) => {
      newIndex = Math.floor(Math.random() * index);
      [
        array[index],
        array[newIndex]
      ] = [
          array[newIndex],
          array[index]
        ];
    });
    return array;
  }

  function getWordAndExamDataFromMyDictionary() {
    const newExamDictionary: (WordAndExamData | null)[] = myDictionary.map((wordsAndData) => {
      const russianTranslations = wordsAndData.usages.at(0)?.definitionData.at(0)?.russianTranslations;

      if (russianTranslations === undefined || russianTranslations.length === 0) {
        return null;
      }

      return {
        ...wordsAndData,
        examData: {
          word: wordsAndData.word,
          level: "B1",
          russianTranslations: russianTranslations
        }
      }
    });

    const filteredExamDictionary = newExamDictionary.filter((wordData) => wordData !== null) as WordAndExamData[];

    return shuffleArray(filteredExamDictionary);
  }

  function getWordAndExamDataFromExamDictionary() {
    return examDictionary.filter((wordAndExamData) =>
      (wordAndExamData.examData.level === "A1" && isA1LevelOn)
      || (wordAndExamData.examData.level === "A2" && isA2LevelOn)
      || (wordAndExamData.examData.level === "B1" && isB1LevelOn));
  }

  const refreshGameWords = useCallback(
    () => {
      const numberOfWordsInt = parseInt(quantity);

      switch (mode) {
        case "any":
          const filteredDictionary: WordAndExamData[] = getWordAndExamDataFromExamDictionary();

          if (filteredDictionary.length === 0) {
            if (isA1LevelOn || isA2LevelOn || isB1LevelOn) {
              dispatch({ type: "dictionary/fetchRandomWords" });
              return;
            }

            if (quantity != null && quantity !== "0" && !isNaN(numberOfWordsInt)) {
              setGameWords(shuffleArray(examDictionary.slice(0, numberOfWordsInt)));
            } else {
              setGameWords(shuffleArray(examDictionary));
            }

            return;
          }

          if (quantity != null && quantity !== "0" && !isNaN(numberOfWordsInt)) {
            setGameWords(shuffleArray(filteredDictionary.slice(0, numberOfWordsInt)));
          } else {
            setGameWords(shuffleArray(filteredDictionary));
          }

          break;
        case "my_dictionary":
          const newExamDictionary: WordAndExamData[] = getWordAndExamDataFromMyDictionary();
          if (quantity != null && quantity !== "0" && !isNaN(numberOfWordsInt)) {
            setGameWords(shuffleArray(newExamDictionary.slice(0, numberOfWordsInt)));
          } else {
            setGameWords(shuffleArray(newExamDictionary));
          }

          break;
        default:
          const dictionary: WordAndExamData[] = getWordAndExamDataFromMyDictionary();

          const filteredExamDictionary: WordAndExamData[] = getWordAndExamDataFromExamDictionary();

          if (quantity != null && quantity !== "0" && !isNaN(numberOfWordsInt)) {

            // Up to half of the size of the array is populated with words from user's dictionary
            const wordsToPlay = dictionary.slice(0, Math.floor(numberOfWordsInt / 2));

            for (const item of filteredExamDictionary) {
              if (wordsToPlay.length < numberOfWordsInt) {
                wordsToPlay.push(item);
              } else {
                break;
              }
            }

            setGameWords(shuffleArray(wordsToPlay));
          } else {
            const wordsToPlay = dictionary.concat(filteredExamDictionary);
            setGameWords(shuffleArray(wordsToPlay));
          }
          break;
      }
    },
    [
      quantity,
      examDictionary,
      myDictionary,
      isA1LevelOn,
      isA2LevelOn,
      isB1LevelOn,
      shuffleArray,
      setGameWords
    ]
  );

  useEffect(() => {
    if (quantity !== "0" && wasPopulated === true) return;
    if (examDictionary.length > 0 && gameWords.length === 0) {
      refreshGameWords();
      setWasPopulated(true);
    }
  }, [
    examDictionary
  ]);

  const removeWordFromExamDictionary = useCallback(
    () => {
      const newExamDictionary = examDictionary.filter((word) => word !== gameWords[0]);

      dispatch(setExamDictionary(newExamDictionary));
    },
    [
      examDictionary,
      gameWords
    ]
  );

  const checkAnswer = useCallback(
    () => {
      const answerLowercase = answer.toLowerCase().trim();

      if (answerLowercase === "" || gameWords.length === 0) {
        return;
      }

      const currentWordLowercase = gameWords[0].examData.word.split("+").join("").toLowerCase();

      if (currentWordLowercase === answerLowercase) {
        setIsAnswerVisible(false);
        removeWordFromExamDictionary();

        setGameWords(gameWords.filter((
          _, index
        ) => index !== 0));
        if (lastIncorrectWord !== currentWordLowercase) {
          setCorrectCount(correctCount + 1);
          setResultsData([...resultsData, {
            word: gameWords[0],
            answer: currentWordLowercase,
            userAnswer: answerLowercase
          }]);
        }
      } else {
        if (lastIncorrectWord !== currentWordLowercase) {
          setLastIncorrectWord(currentWordLowercase);
          setIncorrectCount(incorrectCount + 1);
          setResultsData([...resultsData, {
            word: gameWords[0],
            answer: currentWordLowercase,
            userAnswer: answerLowercase
          }]);
        }

        setIsAnswerValid(false);
        setIsAnswerVisible(true);

      }

      setAnswer("");

      setTimeout(
        () => {
          textInputRef.current?.focus();

        },
        1000
      );
    },
    [
      answer,
      gameWords,
      correctCount,
      incorrectCount,
      textInputRef
    ]
  );

  function addMistake() {
    const currentWordLowercase = gameWords.at(0)?.word.split("+").join("").toLowerCase();

    if (currentWordLowercase === undefined) {
      showHint(
        i18n.t("error_try_again", { defaultValue: "Oii, miski viga! Proovi uuesti!" }),
        2500
      );
    }

    if (currentWordLowercase !== undefined && lastIncorrectWord !== currentWordLowercase) {
      setLastIncorrectWord(currentWordLowercase);
      setIncorrectCount(incorrectCount + 1);
      setResultsData([...resultsData, {
        word: gameWords[0],
        answer: currentWordLowercase,
        userAnswer: " "
      }]);
    }
  }

  const skipWord = useCallback(() => {
    addMistake();

    setIsAnswerVisible(false);
    removeWordFromExamDictionary();
    const newGameWords = gameWords.filter((
      _, index
    ) => index !== 0)

    setGameWords(newGameWords);

    setAnswer("");

    if (newGameWords.length === 0 && resultsData.length === 0) {
      router.replace("/");
    }
  }, [
    addMistake,
    removeWordFromExamDictionary,
    gameWords,
    resultsData,
    router
  ]);

  const showWord = useCallback(
    () => {
      addMistake();

      setIsAnswerValid(false);
      setIsAnswerVisible(true);
    },
    [
      addMistake,
    ]
  );

  const onTextFieldFocus = useCallback(
    () => {
      setIsAnswerValid(true)
    },
    []
  );

  function getScoreColor() {
    if (correctCount + incorrectCount === 0) return CommonColors.green;

    const correctPercentage = (correctCount * 100) / (correctCount + incorrectCount);

    if (correctPercentage > 90) {
      return CommonColors.green;
    } else if (correctPercentage > 75) {
      return "yellow";
    } else if (correctPercentage >= 50) {
      return "orange";
    } else {
      return "red";
    }
  }

  function resetEverything() {

    setAnswer("");
    setIsAnswerValid(false);
    setIsAnswerVisible(false);
    setCorrectCount(0);
    setIncorrectCount(0);
    setLastIncorrectWord("");
    setResultsData([]);
  }

  const restartGame = useCallback(() => {
    const newGameWords: WordAndExamData[] = resultsData.map((result) => {
      return result.word;
    });

    setGameWords(newGameWords);

    resetEverything();
  }, [resultsData, resetEverything]);

  const restartToFixMistakes = useCallback(() => {
    const newGameWords: WordAndExamData[] = resultsData.map((result) => {
      if (result.answer !== result.userAnswer) return result.word;

      return null;
    }).filter((word) => word !== null) as WordAndExamData[];

    setGameWords(newGameWords);

    resetEverything();
  }, [resultsData]);

  if (gameWords.length === 0 && resultsData.length > 0) {
    return <TranslateWordsGameResults
      results={resultsData}
      correctCount={correctCount}
      incorrectCount={incorrectCount}
      onRestart={restartGame}
      onRestartToFixMistakes={restartToFixMistakes}
    />
  }

  return (
    <ScrollView
      testID="TRANSLATE.CONTAINER:VIEW"
      contentContainerStyle={styles.container}
    >
      <View style={styles.topContainer}>
        {
          gameWords.length === 0
            ? <Text style={styles.loadingWordsText}>
              {i18n.t("Translate_taking_words_from_dictionary", { defaultValue: "Võtame sõnad sõnastikust..." })}
            </Text>
            :
            <>
              {quantity !== "0" &&
                <Text style={styles.wordsLeftText}>
                  {i18n.t("Translate_words_remaining", { defaultValue: "%{count} sõnad on jaanud", count: gameWords.length })}
                </Text>
              }
              <View>
                <Text style={[styles.scoreText, { color: getScoreColor() }]}>
                  {correctCount}/{correctCount + incorrectCount}
                </Text>
              </View>
            </>
        }
        <ExamWordComponent
          mode={mode}
          gameWords={gameWords}
          isAnswerVisible={isAnswerVisible}
        />
      </View>
      <View testID="TRANSLATE.CONTAINER.BOTTOM_CONTAINER:VIEW" style={styles.interactiveContainer} >
        <TextAnswerField
          textInputRef={textInputRef}
          onSubmit={checkAnswer}
          onFocus={onTextFieldFocus}
          isAnswerValid={isAnswerValid}
        />
        <View style={[styles.row]}>
          <CustomIconButton
            testID="TRANSLATE.CONTAINER.BOTTOM_CONTAINER.SKIP_ICON:PRESSABLE"
            style={styles.buttonBackground}
            onPress={skipWord}
            ariaLabel={i18n.t("skip_word", { defaultValue: "Järgmine sõna" })}
          >
            <SkipNextIcon />
          </CustomIconButton>
          <CustomIconButton
            testID="TRANSLATE.CONTAINER.BOTTOM_CONTAINER.SHOW_ICON:PRESSABLE"
            style={styles.buttonBackground}
            onPress={showWord}
            ariaLabel={i18n.t("show_word", { defaultValue: "Näita sõna" })}
          >
            <VisibilityIcon />
          </CustomIconButton>
        </View>
      </View>
      <AnswerStatusOverlay
        correctCount={correctCount}
        incorrectCount={incorrectCount} />
    </ScrollView >
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    width: "100%",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: CommonColors.black,
    paddingVertical: 10
  },
  topContainer: {
    alignItems: "center",
    minHeight: "45%",
  },
  interactiveContainer: {
    justifyContent: "center",
    alignItems: "center",
    gap: 10
  },
  loadingWordsText: {
    color: CommonColors.white,
    fontSize: 20,
    marginTop: 10
  },
  wordsLeftText: {
    color: CommonColors.white,
    fontSize: 16,
    marginVertical: 5
  },
  scoreText: {
    fontSize: 16,
    fontWeight: "bold"
  },

  bold: {
    fontWeight: "bold"
  },
  row: {
    flexDirection: "row",
    gap: 10
  },
  buttonBackground: {
    backgroundColor: "black",
    borderRadius: 5
  }
})
