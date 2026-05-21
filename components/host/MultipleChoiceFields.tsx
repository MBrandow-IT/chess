"use client";

export function MultipleChoiceFields({
  choices,
  correctChoice,
  onChange,
}: {
  choices: string[];
  correctChoice: number;
  onChange: (next: { choices: string[]; correctChoice: number }) => void;
}) {
  function updateChoice(index: number, value: string) {
    const next = [...choices];
    next[index] = value;
    onChange({ choices: next, correctChoice });
  }

  function addChoice() {
    if (choices.length >= 4) return;
    onChange({ choices: [...choices, ""], correctChoice });
  }

  function removeChoice(index: number) {
    if (choices.length <= 2) return;
    const next = choices.filter((_, i) => i !== index);
    let nextCorrect = correctChoice;
    if (index === correctChoice) nextCorrect = 0;
    else if (index < correctChoice) nextCorrect -= 1;
    onChange({ choices: next, correctChoice: nextCorrect });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Answer choices</p>
      <ul className="space-y-2">
        {choices.map((choice, index) => (
          <li key={index} className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="correct-choice"
                checked={correctChoice === index}
                onChange={() => onChange({ choices, correctChoice: index })}
                className="h-4 w-4"
              />
              <span className="font-medium text-buckeye-gray">
                {String.fromCharCode(65 + index)}.
              </span>
            </label>
            <input
              type="text"
              value={choice}
              onChange={(e) => updateChoice(index, e.target.value)}
              className="focus-ring min-w-0 flex-1 rounded-md border border-black/10 px-3 py-2 text-sm"
              placeholder={`Choice ${index + 1}`}
            />
            {choices.length > 2 ? (
              <button
                type="button"
                onClick={() => removeChoice(index)}
                className="text-xs text-red-700 hover:underline"
              >
                Remove
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      {choices.length < 4 ? (
        <button
          type="button"
          onClick={addChoice}
          className="focus-ring rounded-md border border-black/10 bg-white px-3 py-1.5 text-sm font-medium hover:bg-black/5"
        >
          Add choice
        </button>
      ) : null}
    </div>
  );
}
