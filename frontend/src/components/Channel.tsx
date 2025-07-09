interface ChannelProps {
  name: string;
}

export default function Channel({ name }: ChannelProps) {
  return (
    <div className="inline-block bg-yellow-300 px-3 py-1 rounded-full text-sm font-medium shadow hover:bg-yellow-400 transition-colors">
      #{name}
    </div>
  );
}
