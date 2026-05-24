const fs = require('fs');
const path = 'e:/New folder/wearshare-app/app/list-item/page.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  '  const [unavailable, setUnavailable] = useState<Date[] | undefined>([]);\n  const [submitted, setSubmitted] = useState(false);\n  const fileRef = useRef<HTMLInputElement>(null);',
  `  const [unavailable, setUnavailable] = useState<Date[] | undefined>([]);
  const [submitted, setSubmitted] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const analyzeImage = async (file: File) => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/ai/listing-assistant", { method: "POST", body: formData });
      const data = await res.json();
      if (!data.error) {
        if (data.title) setTitle(data.title);
        if (data.category && CATEGORIES.includes(data.category)) setCategory(data.category);
        if (data.retailPrice) setRetail(data.retailPrice);
        if (data.pricePerDay) setPricePerDay(data.pricePerDay);
        if (data.deposit) setDeposit(data.deposit);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };`
);

content = content.replace(
  `  const onFiles = (files: FileList | null) => {\n    if (!files) return;\n    const next: string[] = [];\n    Array.from(files).slice(0, 6 - photos.length).forEach((f) => {\n      if (f.type.startsWith("image/")) next.push(URL.createObjectURL(f));\n    });\n    setPhotos((p) => [...p, ...next].slice(0, 6));\n  };`,
  `  const onFiles = (files: FileList | null) => {
    if (!files) return;
    const next: string[] = [];
    Array.from(files).slice(0, 6 - photos.length).forEach((f, idx) => {
      if (f.type.startsWith("image/")) {
        next.push(URL.createObjectURL(f));
        if (photos.length === 0 && idx === 0) {
          analyzeImage(f);
        }
      }
    });
    setPhotos((p) => [...p, ...next].slice(0, 6));
  };`
);

content = content.replace(
  `            {/* Photos */}\n            <div>\n              <Label num="01" title="Photos" hint={\`\${photos.length}/6 / minimum 3 in daylight\`} />`,
  `            {/* Photos */}
            <div>
              <div className="flex items-center justify-between">
                <Label num="01" title="Photos" hint={\`\${photos.length}/6 / minimum 3 in daylight\`} />
                {photos.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (fileRef.current?.files?.[0]) analyzeImage(fileRef.current.files[0]);
                    }}
                    className={\`text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors \${
                      isAnalyzing ? "bg-primary/20 text-primary" : "bg-primary/10 text-primary hover:bg-primary hover:text-white"
                    }\`}
                    disabled={isAnalyzing}
                  >
                    <Sparkles className={\`h-3 w-3 \${isAnalyzing ? "animate-spin" : ""}\`} />
                    {isAnalyzing ? "AI is analyzing..." : "Auto-fill with AI"}
                  </button>
                )}
              </div>`
);

content = content.replace(
  `                <Field label="Title">\n                  <input`,
  `                <Field label="Title">\n                  {isAnalyzing ? <div className="h-10 bg-muted animate-pulse rounded-md w-full"></div> : <input`
);

content = content.replace(
  `                    required\n                  />\n                </Field>`,
  `                    required\n                  />}\n                </Field>`
);

content = content.replace(
  `                <Field label="Category">\n                  <select value={category}`,
  `                <Field label="Category">\n                  {isAnalyzing ? <div className="h-10 bg-muted animate-pulse rounded-md w-full"></div> : <select value={category}`
);

content = content.replace(
  `                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}\n                  </select>\n                </Field>`,
  `                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}\n                  </select>}\n                </Field>`
);

fs.writeFileSync(path, content);
console.log('Done');
