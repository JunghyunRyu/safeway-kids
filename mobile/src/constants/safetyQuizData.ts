/**
 * P3-63: Safety Quiz data — 10 traffic safety questions for students.
 */

export interface QuizQuestion {
  id: number;
  question: string;
  answer: boolean; // true = O, false = X
  explanation: string;
}

export const SAFETY_QUIZ_DATA: QuizQuestion[] = [
  {
    id: 1,
    question: "차량이 완전히 멈추기 전에 자리에서 일어나도 괜찮다.",
    answer: false,
    explanation: "차량이 완전히 멈출 때까지 자리에 앉아 안전벨트를 매고 있어야 해요.",
  },
  {
    id: 2,
    question: "횡단보도를 건널 때는 초록불이 켜진 후 좌우를 확인하고 건너야 한다.",
    answer: true,
    explanation: "초록불이 켜져도 먼저 좌우를 살피고 차가 멈춘 것을 확인한 후 건너요.",
  },
  {
    id: 3,
    question: "셔틀버스에서 내린 후 버스 앞으로 바로 건너가도 된다.",
    answer: false,
    explanation: "버스 앞뒤로 건너면 다른 차가 보이지 않아 위험해요. 버스가 떠난 후 건너세요.",
  },
  {
    id: 4,
    question: "차에 탈 때는 항상 안전벨트를 매야 한다.",
    answer: true,
    explanation: "안전벨트는 우리를 지켜주는 가장 중요한 안전장치예요!",
  },
  {
    id: 5,
    question: "비 오는 날 밝은 색 옷을 입으면 운전자가 나를 잘 볼 수 있다.",
    answer: true,
    explanation: "밝은 색 옷이나 반사 소재를 착용하면 운전자가 잘 볼 수 있어 안전해요.",
  },
  {
    id: 6,
    question: "차 안에서 친구와 장난치며 놀아도 괜찮다.",
    answer: false,
    explanation: "차 안에서 장난치면 넘어지거나 다칠 수 있어요. 조용히 앉아 있어야 해요.",
  },
  {
    id: 7,
    question: "도로에서 공놀이를 하면 안 된다.",
    answer: true,
    explanation: "도로는 차가 다니는 곳이에요. 공놀이는 놀이터나 공원에서 해요.",
  },
  {
    id: 8,
    question: "차에서 내릴 때는 문을 열기 전에 뒤에 오는 차를 확인해야 한다.",
    answer: true,
    explanation: "문을 갑자기 열면 자전거나 오토바이가 부딪힐 수 있어요. 꼭 확인하세요!",
  },
  {
    id: 9,
    question: "신호등이 없는 골목길에서는 빨리 뛰어서 건너면 된다.",
    answer: false,
    explanation: "뛰면 넘어지거나 차를 발견하지 못할 수 있어요. 멈추고 좌우를 살핀 후 걸어서 건너요.",
  },
  {
    id: 10,
    question: "학원 차량 안에서 선생님이나 기사님 말씀을 잘 들어야 한다.",
    answer: true,
    explanation: "선생님과 기사님은 우리의 안전을 위해 노력하시는 분들이에요. 잘 따라야 해요!",
  },
];
