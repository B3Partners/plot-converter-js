import jdk.nashorn.api.scripting.*;
import javax.script.*;
import java.io.*;

public class Demo {
    public static void main(String[] args) throws Exception {
        System.out.println("Compiling JavaScript...");
        ScriptEngine engine = new ScriptEngineManager().getEngineByName("nashorn");
        CompiledScript compiled = ((Compilable)engine).compile(new InputStreamReader(new FileInputStream("dist/plot-converter.dev.js")));
        Bindings bindings = engine.createBindings();
        compiled.eval(bindings);
        ScriptObjectMirror plotConverter = (ScriptObjectMirror)bindings.get("PlotConverter");
        Object result = ((JSObject)plotConverter.getMember("hello")).call(null);
        System.out.println(result);
    }
}