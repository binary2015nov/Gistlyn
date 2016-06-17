﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Gistlyn.Common.Interfaces;
using Gistlyn.Common.Objects;
using Microsoft.CodeAnalysis.CSharp.Scripting;
using Microsoft.CodeAnalysis.Diagnostics;
using Microsoft.CodeAnalysis.Scripting;
using ServiceStack;
using ServiceStack.Text;

namespace Gistlyn.SnippetEngine
{
    public class ScriptRunner
    {
        Task<ScriptState<int>> state;
        ScriptStatus status;

        enum GetVariableResult
        {
            Success,
            WrongExpression,
            NullReferenceException,
            IndexOutOfRangeException
        }

        private ScriptStatus GetScriptStateStatus()
        {
            if (state != null)
            {
                switch (state.Status)
                {
                    case TaskStatus.RanToCompletion:
                        status = ScriptStatus.Completed;
                        break;
                    case TaskStatus.Running:
                        status = ScriptStatus.Running;
                        break;
                    case TaskStatus.Faulted:
                        status = ScriptStatus.ThrowedException;
                        break;
                    case TaskStatus.Canceled:
                        status = ScriptStatus.Cancelled;
                        break;
                }
            }
            else {
                status = ScriptStatus.Unknown;
            }

            return status;
        }

        public ScriptStatus GetScriptStatus()
        {
            if (status == ScriptStatus.CompiledWithErrors || status == ScriptStatus.PrepareToRun)
                return status;

            return GetScriptStateStatus();
        }

        public ScriptVariableJson GetVariableJson(string name)
        {
            ScriptVariableJson json = new ScriptVariableJson()
            {
                Status = GetScriptStatus()
            };

            if (json.Status == ScriptStatus.Completed)
            {
                GetVariableResult varResult;
                var variable = GetVariableByName(name, out varResult);

                JsConfig.MaxDepth = 10;
                json.Json = variable != null ? variable.ToJson() : String.Empty;
                json.Name = name;
            }

            return json;
        }

        private bool IsObjectBrowseable(object obj)
        {
            if (obj == null)
                return false;
            
            var type = obj.GetType();

            return !type.IsPrimitive && type != typeof(string);
        }

        private object GetVariableByName(string parentVariable, out GetVariableResult error)
        {
            if (String.IsNullOrEmpty(parentVariable))
            {
                throw new ArgumentException("parentVariable");
            }

            string[] parts = parentVariable.Split('.');

            //TODO: handle indexer
            object curVar = state.Result.Variables.FirstOrDefault(v => v.Name == parts[0]);

            if (curVar == null)
            {
                error = GetVariableResult.WrongExpression;
                return null;
            }

            curVar = ((ScriptVariable)curVar).Value;

            for (int i = 0; i < parts.Length; i++)
            {
                string part = parts[i];
                //check if indexer
                int firstIdx = part.IndexOf('[');
                int lastIdx = part.LastIndexOf(']');
                if (firstIdx != -1 && lastIdx != -1 && firstIdx < lastIdx)
                {
                    int index;

                    //TODO: expression error
                    if (!Int32.TryParse(part.Substring(firstIdx, lastIdx), out index))
                    {
                        error = GetVariableResult.WrongExpression;
                        return null;
                    }

                    //TODO: index out of range
                    Type t = curVar.GetType();
                    //search indexer
                    PropertyInfo[] props = t.GetProperties().Where(p => p.GetIndexParameters().Length > 0).ToArray();

                    //we have indexer
                    if (props != null && props.Length > 0)
                    {
                        curVar = props[0].GetValue(curVar, new object[] { index });
                    }
                }
                else if (firstIdx == -1 && lastIdx == -1)
                {
                    if (i > 0)
                    {
                        Type t = curVar.GetType();
                        PropertyInfo prop = t.GetProperty(part);

                        if (prop == null)
                        {
                            error = GetVariableResult.WrongExpression;
                            return null;
                        }
                        curVar = prop.GetValue(curVar);
                    }
                }
                else
                {
                    error = GetVariableResult.WrongExpression;
                    return null;
                }
            }

            error = GetVariableResult.Success;
            return curVar;
        }

        public ScriptStateVariables GetVariables(string parentVariable)
        {
            ScriptStateVariables variables = new ScriptStateVariables()
            {
                Status = GetScriptStatus(),
                ParentVariable = new VariableInfo() { Name = parentVariable },
                Variables = new List<VariableInfo>() 
            };

            if (variables.Status == ScriptStatus.Completed)
            {
                if (!String.IsNullOrEmpty(parentVariable))
                {
                    GetVariableResult varResult;
                    object curVar = GetVariableByName(parentVariable, out varResult);

                    variables.ParentVariable.Type = curVar != null ? curVar.GetType().ToString() : null;
                    variables.ParentVariable.Value = curVar != null ? curVar.ToString(): null;

                    PropertyInfo[] finalProps = curVar != null
                        ? curVar.GetType().GetProperties(BindingFlags.Static | BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public)
                        : new PropertyInfo[] { };

                    foreach (var prop in finalProps)
                    {
                        object val = prop.GetValue(curVar, null);
                        var info = new VariableInfo()
                        {
                            Name = prop.Name,
                            Value = val != null ? val.ToString() : null,
                            Type = val != null ? val.GetType().ToString() : prop.PropertyType.ToString(),
                            IsBrowseable = IsObjectBrowseable(val)
                        };
                        variables.Variables.Add(info);
                    }
                }
                else 
                {
                    foreach (var variable in state.Result.Variables)
                        variables.Variables.Add(new VariableInfo()
                        {
                            Name = variable.Name,
                            Value = variable.Value != null ? variable.Value.ToString() : null,
                            Type = variable.Type.ToString(),
                            IsBrowseable = IsObjectBrowseable(variable.Value)
                        });
                }
            }

            return variables;
        }

        private void PrepareScript(string mainScript, List<string> scripts, List<string> references, out string script, out ScriptOptions opt)
        {
            GistSourceResolver resolver = new GistSourceResolver(scripts);

            opt = ScriptOptions.Default.WithSourceResolver(resolver);
            if (references != null && references.Count > 0)
                opt = opt.WithReferences(references);

            StringBuilder builder = new StringBuilder();

            foreach (var key in resolver.Scripts.Keys)
            {
                builder.AppendFormat("#load \"{0}\"\n\r", key);
            }

            builder.Append(mainScript);

            script = builder.ToString();
        }

        public ScriptExecutionResult ExecuteAsync(string mainScript, List<string> scripts, List<string> references, INotifier notifier, CancellationToken cancellationToken = default(CancellationToken))
        {
            string script;
            ScriptOptions opt;

            PrepareScript(mainScript, scripts, references, out script, out opt);

            return ExecuteAsync(script, opt, notifier, cancellationToken);
        }

        public ScriptExecutionResult ExecuteAsync(string script, ScriptOptions opt, INotifier notifier, CancellationToken cancellationToken = default(CancellationToken))
        {
            ScriptExecutionResult result = new ScriptExecutionResult() { Variables = new List<VariableInfo>(), Errors = new List<ErrorInfo>() };

            status = ScriptStatus.PrepareToRun;

            //new Thread(() =>
            ThreadPool.QueueUserWorkItem(_ =>
            {
                try
                {
                    state = CSharpScript.RunAsync<int>(script, opt, null, null, cancellationToken);
                    status = GetScriptStateStatus();
                    result.Status = status;
                    if (state.Exception != null && state.Exception.InnerExceptions.Count > 0)
                    {
                        result.Exception = state.Exception.InnerExceptions[0];
                    }
                    notifier.SendScriptExecutionResults(result);
                }
                catch (CompilationErrorException e)
                {
                    status = ScriptStatus.CompiledWithErrors;
                    result.Status = status;
                    foreach (var err in e.Diagnostics)
                        result.Errors.Add(new ErrorInfo() { Info = err.ToString() });

                    notifier.SendScriptExecutionResults(result);
                }
                catch (Exception e)
                {
                    status = ScriptStatus.ThrowedException;
                    result.Exception = e;
                    notifier.SendScriptExecutionResults(result);
                }
            });//.Start();

            result.Status = status;
            notifier.SendScriptExecutionResults(result);

            return result;
        }

        private async Task<ScriptExecutionResult> Execute(string script, ScriptOptions opt)
        {
            ScriptExecutionResult result = new ScriptExecutionResult() { Variables = new List<VariableInfo>(), Errors = new List<ErrorInfo>() };

            try
            {
                state = CSharpScript.RunAsync<int>(script, opt);
                var scriptState = await state;
                //var scriptState = state.Result;

                foreach (var variable in scriptState.Variables)
                    result.Variables.Add(new VariableInfo() { Name = variable.Name, Value = variable.Value != null ? variable.Value.ToString() : null, Type = variable.Type.ToString() });
            }
            catch (CompilationErrorException e)
            {
                foreach (var err in e.Diagnostics)
                    result.Errors.Add(new ErrorInfo() { Info = err.ToString() });
            }
            catch (Exception e)
            {
                result.Exception = e;
            }

            return result;
        }

        public Task<ScriptExecutionResult> Execute(string script)
        {
            return Execute(script, ScriptOptions.Default);
        }

        public Task<ScriptExecutionResult> Execute(string mainScript, List<string> scripts, List<string> references)
        {
            string script;
            ScriptOptions opt;

            PrepareScript(mainScript, scripts, references, out script, out opt);

            return Execute(script, opt);
        }

        public async Task<ScriptExecutionResult> EvaluateExpression(string expr)
        {
            ScriptExecutionResult scriptResult = new ScriptExecutionResult(){ Variables = new List<VariableInfo>(), Errors = new List<ErrorInfo>() };
            scriptResult.Status = GetScriptStatus();

            if (scriptResult.Status == ScriptStatus.Completed)
            {
                try
                {
                    VariableInfo info = new VariableInfo() { Name = String.Empty };

                    var stateResult = await state.Result.ContinueWithAsync(expr);

                    if (stateResult.ReturnValue != null)
                    {
                        info.Type = stateResult.ReturnValue.GetType().ToString();
                        info.Value = stateResult.ReturnValue.ToString();
                    }
                    scriptResult.Variables.Add(info);
                }
                catch (CompilationErrorException e)
                {
                    scriptResult.Status = ScriptStatus.CompiledWithErrors;
                    foreach (var err in e.Diagnostics)
                        scriptResult.Errors.Add(new ErrorInfo() { Info = err.ToString() });
                }
                catch (Exception e)
                {
                    scriptResult.Status = ScriptStatus.ThrowedException;
                    scriptResult.Exception = e;
                }
            }

            return scriptResult;
        }
    }
}