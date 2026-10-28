import type { Progress, QuestionDetail } from '../../api/types'
import InterviewAnswerPlaybook from './InterviewAnswerPlaybook'

interface Props {
  question: QuestionDetail
  progress: Progress
  onProgress: (p: Progress) => void
}

export default function StagePitch(props: Props) {
  return <InterviewAnswerPlaybook {...props} />
}
