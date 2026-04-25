import React from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const EmojiPicker = ({ onEmojiSelect, children, asChild }) => {
  return (
    <Popover>
      <PopoverTrigger asChild={asChild}>{children}</PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-slate-700 bg-transparent shadow-xl z-50">
        <Picker
          data={data}
          onEmojiSelect={(emoji) => onEmojiSelect(emoji.native)}
          theme="dark"
          previewPosition="none"
          skinTonePosition="none"
          maxFrequentRows={1}
        />
      </PopoverContent>
    </Popover>
  );
};

export default EmojiPicker;
