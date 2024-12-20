import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

interface ReviewPageProps {
  story: any;
  onStartNewStory: () => void;
}

export default function ReviewPage({ story, onStartNewStory }: ReviewPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-8 rounded-lg shadow-lg max-w-4xl w-full"
    >
      <h2 className="text-3xl font-bold text-purple-800 mb-6 text-center">
        Story Complete! 🎉
      </h2>

      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-semibold text-purple-600 mb-2">
            {story.main.title}
          </h3>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg">
          <h4 className="text-xl font-semibold text-purple-700 mb-3">
            Words Learned:
          </h4>
          <div className="flex flex-wrap gap-2">
            {story.main.state.global_state.words_learned.map((word: string) => (
              <motion.span
                key={word}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-yellow-200 text-purple-800 px-3 py-1 rounded-full text-sm font-medium"
              >
                {word}
              </motion.span>
            ))}
          </div>
        </div>

        <div className="flex justify-center mt-6">
          <Button
            onClick={onStartNewStory}
            className="text-lg py-2 px-6 bg-yellow-400 hover:bg-yellow-500 text-purple-800 font-bold rounded-full 
                     transition-all duration-200 transform hover:scale-105"
          >
            Start a New Story
          </Button>
        </div>
      </div>
    </motion.div>
  )
} 