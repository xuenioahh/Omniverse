import { Radar, RadarChart as RechartsRadar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

export default function RadarChart({ scores, maxScore = 9 }) {
  const data = Object.entries(scores).map(([key, value]) => ({
    subject: key,
    score: value,
    fullMark: maxScore,
  }));

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadar cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, maxScore]}
            tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 9 }}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke="hsl(258, 90%, 66%)"
            fill="hsl(258, 90%, 66%)"
            fillOpacity={0.25}
            strokeWidth={2}
          />
        </RechartsRadar>
      </ResponsiveContainer>
    </div>
  );
}