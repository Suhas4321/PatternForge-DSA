import { Check, X } from 'lucide-react'
import { useState } from 'react'
import type { Quiz as QuizT } from '../../api/types'

interface Props {
  quiz: QuizT
  solved: boolean
  onSolved: () => void
}

export default function Quiz({ quiz, solved, onSolved }: Props) {
  const [picked, setPicked] = useState<number | null>(solved ? quiz.answer : null)
  const correct = picked === quiz.answer

  return (
    <div>
      <p className="mb-3 text-chalk">{quiz.prompt}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {quiz.options.map((opt, i) => {
          const isPicked = picked === i
          const state = isPicked ? (i === quiz.answer ? 'right' : 'wrong') : null
          return (
            <button
              key={opt}
              disabled={correct}
              onClick={() => {
                setPicked(i)
                if (i === quiz.answer) onSolved()
              }}
              className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                state === 'right'
                  ? 'border-verdigris bg-verdigris/10 text-chalk'
                  : state === 'wrong'
                    ? 'border-oxide bg-oxide/10 text-chalk'
                    : 'border-line text-chalk hover:border-muted disabled:opacity-50 disabled:hover:border-line'
              }`}
            >
              <span className="font-mono">{opt}</span>
              {state === 'right' && <Check size={16} className="text-verdigris" />}
              {state === 'wrong' && <X size={16} className="text-oxide" />}
            </button>
          )
        })}
      </div>
      {picked !== null && (
        <p className={`mt-3 text-sm ${correct ? 'text-muted' : 'text-oxide'}`}>
          {correct ? quiz.explanation : 'Not quite. Re-read the constraints and the trigger words, then try again.'}
        </p>
      )}
    </div>
  )
}
